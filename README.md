# Tournament Management Backend

## 🎯 Project Purpose
This project is a comprehensive backend API service designed to power a sports tournament and camp management platform. It seamlessly handles core operations ranging from user authentication and team rostering to complex tournament scheduling, camp registrations, and payment processing.

## ✨ Key Features
- **User & Role Management**: Robust authentication system supporting Players, Coaches, Referees, and Administrators.
- **Tournament & Series Management**: End-to-end handling of tournaments, divisions, and series leaderboards.
- **Team & Roster Building**: Dynamic team creation, player invitations, and complete roster management.
- **Match Scheduling**: Tracking of matches, scores, schedules, and division standings.
- **Camp Registrations**: Built-in system for managing training camps, including dynamic capacity waitlists.
- **Payment Processing**: Integrated payment flows with support for discount overrides.
- **Real-time Notifications**: Alerts and updates for essential user and system activities.

---

## 🛣️ API Routes Documentation

This section outlines all the available REST API endpoints for the application.

## Users (`/users`)

| HTTP Method | Endpoint Path | 
| :--- | :--- |
| **POST** | `/users` | 
| **GET** | `/users` | 
| **GET** | `/users/admin/home-page` | 
| **GET** | `/users/:id` | 
| **PUT** | `/users/profile` | 
| **PATCH** | `/users/delete/:id` | 
| **PUT** | `/users/toggle-block/:id` | 
| **POST** | `/users/support/message` | 
| **POST** | `/users/upload-photo` | 
| **PUT** | `/users/player/profile/:id` | 
| **GET** | `/users/activity/logs` | 

## Auth (`/auth`)

| HTTP Method | Endpoint Path | 
| :--- | :--- |
| **POST** | `/auth/login` | 
| **POST** | `/auth/logout` | 
| **GET** | `/auth/profile` | 
| **PUT** | `/auth/change-password` | 
| **POST** | `/auth/forgot-password` | 
| **POST** | `/auth/resend-otp` | 
| **POST** | `/auth/verify-otp` | 
| **POST** | `/auth/reset-password` | 

## Notifications (`/notifications`)

| HTTP Method | Endpoint Path | 
| :--- | :--- |
| **POST** | `/notifications/send-noti` | 
| **GET** | `/notifications/all-noti` | 
| **GET** | `/notifications/get-noti` | 
| **GET** | `/notifications/unread-noti` | 
| **PATCH** | `/notifications/read-noti` | 
| **POST** | `/notifications/send-group-noti` | 
| **DELETE** | `/notifications/delete-noti/:notificationId` | 

## Tournaments (`/tournaments`)

| HTTP Method | Endpoint Path | 
| :--- | :--- |
| **POST** | `/tournaments` | 
| **GET** | `/tournaments` | 
| **GET** | `/tournaments/get/by/userId/:id` | 
| **PUT** | `/tournaments/:id` | 
| **DELETE** | `/tournaments/:id` | 
| **DELETE** | `/tournaments/division/:divisionId` | 
| **GET** | `/tournaments/division/:teamDivisionId/teams` | 
| **POST** | `/tournaments/division/:divisionId/generate` | 
| **GET** | `/tournaments/division/:divisionId/schedule` | 
| **PATCH** | `/tournaments/match/:matchId/edit` | 
| **PATCH** | `/tournaments/division/:divisionId/publish` | 
| **GET** | `/tournaments/division/:divisionId/standings` | 
| **GET** | `/tournaments/series/:divisionName/leaderboard` | 
| **POST** | `/tournaments/team/:teamId/discount/override` | 

## Team Registrations (`/team-registrations`)

| HTTP Method | Endpoint Path | 
| :--- | :--- |
| **POST** | `/team-registrations` | 
| **GET** | `/team-registrations` | 
| **GET** | `/team-registrations/my-team` | 
| **GET** | `/team-registrations/my-team/:id` | 
| **GET** | `/team-registrations/all/:teamId` | 
| **GET** | `/team-registrations/all/:teamId` | 
| **GET** | `/team-registrations/history/:teamId` | 
| **GET** | `/team-registrations/details-history/:teamId` | 
| **GET** | `/team-registrations/dashboard/:teamId` | 
| **GET** | `/team-registrations/:registrationId` | 
| **PUT** | `/team-registrations/:id` | 
| **DELETE** | `/team-registrations/:id` | 
| **POST** | `/team-registrations/invite-manager/:teamId` | 
| **POST** | `/team-registrations/send-mail/:id` | 
| **POST** | `/team-registrations/:registrationId/cancel` | 

## Team Players (`/team-players`)

| HTTP Method | Endpoint Path | 
| :--- | :--- |
| **POST** | `/team-players` | 
| **GET** | `/team-players` | 
| **GET** | `/team-players/:id` | 
| **PUT** | `/team-players/:id` | 
| **DELETE** | `/team-players/:id` | 

## Referees (`/referees`)

| HTTP Method | Endpoint Path | 
| :--- | :--- |
| **POST** | `/referees` | 
| **GET** | `/referees` | 
| **GET** | `/referees/get/by/userId` | 
| **PUT** | `/referees/:id` | 
| **DELETE** | `/referees/:id` | 

## Players (`/players`)

| HTTP Method | Endpoint Path | 
| :--- | :--- |
| **GET** | `/players` | 
| **GET** | `/players/dashboard` | 
| **GET** | `/players/schedule` | 
| **POST** | `/players` | 

## Coaches (`/coaches`)

| HTTP Method | Endpoint Path | 
| :--- | :--- |
| **POST** | `/coaches` | 
| **GET** | `/coaches` | 
| **GET** | `/coaches/get/by/userId` | 
| **GET** | `/coaches/:id` | 
| **PUT** | `/coaches/:id` | 
| **DELETE** | `/coaches/:id` | 

## Payments (`/payments`)

| HTTP Method | Endpoint Path | 
| :--- | :--- |
| **GET** | `/payments` | 
| **POST** | `/payments/stripe` | 

## Series (`/series`)

| HTTP Method | Endpoint Path | 
| :--- | :--- |
| **POST** | `/series` | 
| **GET** | `/series` | 
| **GET** | `/series/get/by/userId` | 
| **PUT** | `/series/:id` | 
| **DELETE** | `/series/:id` | 

## Teaminvitations (`/teaminvitations`)

| HTTP Method | Endpoint Path | 
| :--- | :--- |
| **POST** | `/teaminvitations/:id` | 
| **GET** | `/teaminvitations` | 
| **GET** | `/teaminvitations/get/by/userId` | 
| **GET** | `/teaminvitations/:id` | 
| **PUT** | `/teaminvitations/:id` | 
| **DELETE** | `/teaminvitations/:id` | 
| **GET** | `/teaminvitations/get/by/coachId` | 
| **PUT** | `/teaminvitations/respond/:id` | 

## Schedules (`/schedules`)

| HTTP Method | Endpoint Path | 
| :--- | :--- |
| **POST** | `/schedules` | 
| **GET** | `/schedules` | 
| **GET** | `/schedules/:id` | 
| **PUT** | `/schedules/:id` | 
| **PUT** | `/schedules/week/:weekId/capacity` | 
| **DELETE** | `/schedules/:id` | 

## Camp Registrations (`/camp-registrations`)

| HTTP Method | Endpoint Path | 
| :--- | :--- |
| **POST** | `/camp-registrations` | 
| **GET** | `/camp-registrations/participants` | 
| **GET** | `/camp-registrations/:id` | 
| **PUT** | `/camp-registrations/player/:playerId/move-session` | 
| **PUT** | `/camp-registrations/:id/cancel` | 
| **PUT** | `/camp-registrations/:id/pay` | 
| **PUT** | `/camp-registrations/:id/refund` | 
| **GET** | `/camp-registrations/dashboard/overview` | 

## Camp Waitlist (`/camp-waitlist`)

| HTTP Method | Endpoint Path | 
| :--- | :--- |
| **POST** | `/camp-waitlist` | 
| **GET** | `/camp-waitlist` | 
| **GET** | `/camp-waitlist/stats` | 
| **POST** | `/camp-waitlist/:id/confirm-offer` | 
| **PATCH** | `/camp-waitlist/:id/move-to-session` | 
| **GET** | `/camp-waitlist/getSingle/:id` | 
| **DELETE** | `/camp-waitlist/:id` | 

