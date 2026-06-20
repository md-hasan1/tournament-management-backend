import cron from "node-cron";
import prisma from "./prisma";
import { UserRole } from "@prisma/client";
import autoSendWaitlistOffers from "../helpars/autoSendWaitlistOffers";
import expireWaitlistOffers from "../helpars/expireWaitlistOffers";

// --------------------
// helpers
// --------------------
const uniq = (arr: (string | null | undefined)[]) =>
    Array.from(new Set(arr.filter(Boolean) as string[]));

const MS_MIN = 60_000;
const MS_HOUR = 60 * MS_MIN;

const formatMatchTime = (d: Date) => d.toISOString();

// --------------------
// main cron starter
// --------------------
export const startCrons = () => {
    // 🔹 Automatically set users inactive if not logged in for 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const updateUserStatus = async () => {
        await prisma.user.updateMany({
            where: {
                lastLoginAt: { lt: threeMonthsAgo },
                status: "ACTIVE",
            },
            data: { status: "INACTIVE" },
        });
    };

    // 🔹 Reactivate suspended users
    const reactivateSuspendedUsers = async () => {
        const now = new Date();

        await prisma.user.updateMany({
            where: {
                status: "SUSPENDED",
                suspendedUntil: { lte: now },
            },
            data: {
                status: "ACTIVE",
                suspendedUntil: null,
            },
        });
    };

    // ✅ Match reminders (T-6 hours)
    const sendMatchRemindersTMinus6H = async () => {
        const now = new Date();

        const target = new Date(now.getTime() + 6 * MS_HOUR);
        const windowStart = new Date(target.getTime() - 1 * MS_MIN);
        const windowEnd = new Date(target.getTime() + 1 * MS_MIN);

        const matches = await prisma.match.findMany({
            where: {
                isPublished: true,
                scheduledAt: { gte: windowStart, lt: windowEnd },
                status: { in: ["SCHEDULED"] },
            },
            select: {
                id: true,
                scheduledAt: true,
                field: true,
                stage: true,
                round: true,
                tournament: { select: { name: true } },
                division: { select: { divisionName: true } },

                homeTeam: {
                    select: {
                        teamName: true,
                        userId: true,
                        teamId: true,
                        teamplayers: {
                            where: { isDeletedTeamPlayer: false },
                            select: { playerId: true },
                        },
                    },
                },

                awayTeam: {
                    select: {
                        teamName: true,
                        userId: true,
                        teamId: true,
                        teamplayers: {
                            where: { isDeletedTeamPlayer: false },
                            select: { playerId: true },
                        },
                    },
                },
            },
        });

        if (!matches.length) return;

        // Admins (already gated)
        const admins = await prisma.user.findMany({
            where: {
                role: UserRole.ADMIN,
                status: "ACTIVE",
                isDeleted: false,
                isMatchReminderNotify: true,
            },
            select: { id: true },
        });
        const adminIds = admins.map((a) => a.id);

        for (const m of matches) {
            // Coaches gated
            const coachCandidateIds = uniq([m.homeTeam.userId, m.awayTeam.userId]);
            const coachAllowed = coachCandidateIds.length
                ? await prisma.user.findMany({
                    where: {
                        id: { in: coachCandidateIds },
                        status: "ACTIVE",
                        isDeleted: false,
                        isMatchReminderNotify: true,
                    },
                    select: { id: true },
                })
                : [];
            const coachIds = coachAllowed.map((u) => u.id);

            // Players gated
            const playerCandidateIds = uniq([
                ...m.homeTeam.teamplayers.map((tp) => tp.playerId),
                ...m.awayTeam.teamplayers.map((tp) => tp.playerId),
            ]);
            const playerAllowed = playerCandidateIds.length
                ? await prisma.user.findMany({
                    where: {
                        id: { in: playerCandidateIds },
                        status: "ACTIVE",
                        isDeleted: false,
                        isMatchReminderNotify: true,
                    },
                    select: { id: true },
                })
                : [];
            const playerIds = playerAllowed.map((u) => u.id);

            // Managers gated
            const teamIds = uniq([m.homeTeam.teamId, m.awayTeam.teamId]);
            const managers = teamIds.length
                ? await prisma.teamManager.findMany({
                    where: { teamId: { in: teamIds } },
                    select: { managerId: true },
                })
                : [];
            const managerCandidateIds = uniq(managers.map((x) => x.managerId));
            const managerAllowed = managerCandidateIds.length
                ? await prisma.user.findMany({
                    where: {
                        id: { in: managerCandidateIds },
                        status: "ACTIVE",
                        isDeleted: false,
                        isMatchReminderNotify: true,
                    },
                    select: { id: true },
                })
                : [];
            const managerIds = managerAllowed.map((u) => u.id);

            const recipientIds = uniq([...adminIds, ...coachIds, ...playerIds, ...managerIds]);
            if (!recipientIds.length) continue;

            const when = formatMatchTime(m.scheduledAt);

            const title = "Match Reminder";
            const body = [
                `Tournament: ${m.tournament?.name ?? "N/A"}`,
                `Division: ${m.division?.divisionName ?? "N/A"}`,
                `Stage: ${m.stage}${typeof m.round === "number" ? ` (Round ${m.round})` : ""}`,
                `Match: ${m.homeTeam.teamName} vs ${m.awayTeam.teamName}`,
                `Time: ${when}`,
                m.field ? `Field: ${m.field}` : null,
            ]
                .filter(Boolean)
                .join("\n");

            await prisma.notification.createMany({
                data: recipientIds.map((userId) => ({
                    userId,
                    title,
                    body,
                    data: JSON.stringify({
                        type: "MATCH_REMINDER",
                        matchId: m.id,
                        remindType: "T_MINUS_6H",
                        scheduledAt: m.scheduledAt,
                        teamIds,
                    }),
                })),
            });
        }
    };

    // ✅ Waiver sign alerts (players only)
    // Rule: if player isWavierAlertNotify=true AND teamplayer is not signed (isAgree=false)
    // Dedupe: don't send again to same player+team within last 24h
    const sendWaiverSignAlerts = async () => {
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * MS_HOUR);

        // Find teamplayers that still need waiver signing
        const pending = await prisma.teamplayer.findMany({
            where: {
                isDeletedTeamPlayer: false,
                isAgree: false, // not signed
                // optionally: status: "Pending"
            },
            select: {
                id: true,
                playerId: true,
                teamregistrationId: true,
                team: {
                    select: {
                        id: true,
                        teamName: true,
                        coach: { select: { id: true, fullName: true } },
                    },
                },
                player: {
                    select: {
                        id: true,
                        status: true,
                        isDeleted: true,
                        isWavierAlertNotify: true,
                        fullName: true,
                    },
                },
            },
            take: 2000, // safety cap; add pagination if needed
        });

        if (!pending.length) return;

        for (const tp of pending) {
            // Player must be eligible + opted in
            if (
                !tp.player ||
                tp.player.isDeleted === false ||
                tp.player.status !== "ACTIVE" ||
                tp.player.isWavierAlertNotify !== true
            ) {
                continue;
            }

            const userId = tp.player.id;
            const teamRegId = tp.teamregistrationId;

            // ✅ Dedup check (same player+team within last 24h)
            // We store structured JSON in Notification.data, so we can search by contains.
            const dedupeNeedle = `"type":"WAIVER_ALERT","teamregistrationId":"${teamRegId}","playerId":"${userId}"`;

            const alreadySent = await prisma.notification.findFirst({
                where: {
                    userId,
                    createdAt: { gte: last24h },
                    data: { contains: dedupeNeedle },
                },
                select: { id: true },
            });

            if (alreadySent) continue;

            const title = "Waiver Signature Required";
            const body = [
                `Team: ${tp.team?.teamName ?? "N/A"}`,
                tp.team?.coach?.fullName ? `Coach: ${tp.team.coach.fullName}` : null,
                `Please sign your waiver to stay eligible for matches.`,
            ]
                .filter(Boolean)
                .join("\n");

            await prisma.notification.create({
                data: {
                    userId,
                    title,
                    body,
                    data: JSON.stringify({
                        type: "WAIVER_ALERT",
                        teamplayerId: tp.id,
                        teamregistrationId: teamRegId,
                        playerId: userId,
                    }),
                },
            });
        }
    };

    // 🔹 Auto-expire offers after 24 hours
    const autoExpireWaitlistOffers = async () => {
        try {
            await expireWaitlistOffers();
        } catch (error) {
            console.error("Auto-expire waitlist offers error:", error);
        }
    };

    // sync SchedulePeriod status based on its own startDate / endDate fields
    const syncSchedulePeriodStatuses = async () => {
        const now = new Date();

        // Periods within their date range → ACTIVE
        await prisma.schedulePeriod.updateMany({
            where: {
                status: { not: "ACTIVE" },
                isDeleted: false,
                startDate: { lte: now },
                endDate: { gte: now },
            },
            data: { status: "ACTIVE" },
        });

        // Periods past their endDate → CLOSED
        await prisma.schedulePeriod.updateMany({
            where: {
                status: { not: "CLOSED" },
                isDeleted: false,
                endDate: { lt: now },
            },
            data: { status: "CLOSED" },
        });
    };

    // also sync ScheduleWeek status the same way
    const syncScheduleWeekStatuses = async () => {
        const now = new Date();
        
        await prisma.scheduleWeek.updateMany({
            where: { status: { not: "CLOSED" }, endDate: { lt: now } },
            data: { status: "CLOSED" },
        });
    };

    // --------------------
    // schedules
    // --------------------
    cron.schedule("0 0 * * *", updateUserStatus); // daily midnight
    cron.schedule("0 0 * * *", reactivateSuspendedUsers); // daily midnight

    // match reminders: every minute (tight window)
    cron.schedule("* * * * *", async () => {
        try {
            await sendMatchRemindersTMinus6H();
        } catch (e) {
            console.error("Match reminder cron error:", e);
        }
    });

    // waiver alerts: every day at 09:00 server time (adjust as you want)
    cron.schedule("0 9 * * *", async () => { // daily 9am
        try {
            await sendWaiverSignAlerts();
        } catch (e) {
            console.error("Waiver alert cron error:", e);
        }
    });

    // auto-send waitlist offers: every 30 minutes
    cron.schedule("*/30 * * * *", async () => {
        try {
            await autoSendWaitlistOffers();
        } catch (e) {
            console.error("Auto-send waitlist offers cron error:", e);
        }
    });

    // auto-expire waitlist offers: every hour
    cron.schedule("0 * * * *", async () => {
        try {
            await autoExpireWaitlistOffers();
        } catch (e) {
            console.error("Auto-expire waitlist offers cron error:", e);
        }
    });

    // schedule status syncs: daily at midnight
    cron.schedule("0 0 * * *", async () => {
        try {
            await syncSchedulePeriodStatuses();
        } catch (e) {
            console.error("Schedule period status sync cron error:", e);
        }
    });

    cron.schedule("0 0 * * *", async () => {
        try {
            await syncScheduleWeekStatuses();
        } catch (e) {
            console.error("Schedule week status sync cron error:", e);
        }
    });

    console.log("⏰ Cron jobs started");
};
