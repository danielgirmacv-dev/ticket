# 05 — Frequently Asked Questions

**Document:** User Manual  
**System:** EEC IT Asset & Ticket Management System  
**Version:** 1.0

---

## Accounts and login

**Why can I not log in after registering?**  
New accounts stay **pending** until a manager or Super Admin approves them. If you still cannot log in after approval, confirm you are using the same email and that the account was not rejected.

**I forgot my password.**  
The current system does not email a reset link. Ask an Admin or Super Admin to update your password or create a new account.

**Can I use the same email as a colleague?**  
No. Email must be unique.

---

## Tickets

**Why is Submit disabled or why do I get an error about too many requests?**  
Requesters may have only **three active tickets**. Wait until one is completed or cancelled.

**Who receives my ticket?**  
The system routes by **support category** (IT Support, SAP, General) to that department’s manager. If routing looks wrong, a manager can **Transfer** the ticket.

**Can I attach photos?**  
Yes, on create: up to five files, 5 MB each, images or PDF.

**The technician finished but the ticket is not Closed.**  
Status is **Completed – Pending Review**. The requester or a manager must approve completion. If the work is incomplete, choose rework / reopen.

**Will the technician see my written feedback?**  
No. Technicians see the **star rating** only. Comments stay with managers.

**Can I pick any technician?**  
Only managers assign technicians, and only within the matching support domain.

---

## Notifications

**I do not get SMS.**  
Add a valid phone number on your profile. SMS also depends on the organization gateway being configured and funded.

**I do not get Telegram messages.**  
Link Telegram in Settings (the link expires in 15 minutes) and confirm the bot is enabled by IT. Unlink and link again if the chat id was never stored.

**How do I clear the bell badge?**  
Open notifications or use **Mark all as read**.

---

## Assets and admin

**Who can add assets?**  
Users with **manage assets** (Admin and Super Admin). Requesters and technicians can usually **view** assets.

**CSV import failed.**  
Check required headers: `name`, `type`, `serial_number`, `purchase_date`, `location`, `status`. Type and status must match the allowed lists. The import response lists row-level errors.

**Schedules exist but no tickets appear.**  
Preventive tickets are created by a server command. Ask operations to confirm `maintenance:check-schedules` (and the Laravel scheduler) is running.

**Why can I not create another manager?**  
Only a **Super Admin** can create Admin or Super Admin accounts. Department Admins create technicians in their own category.

---

## Help chatbot

**Is the chatbot ChatGPT?**  
No. It searches published FAQ articles by keywords. Add more FAQs (and publish them) to improve answers.

**The chatbot found nothing.**  
Submit a ticket, or ask a manager to add an FAQ for that topic.

---

## Technical (for IT)

**Which browsers are supported?**  
Current Chrome, Edge, Firefox, and Safari with JavaScript enabled.

**The page is blank after a release.**  
Hard-refresh (Ctrl+F5) or clear cache. Confirm the frontend build points at the correct `VITE_API_URL`.

**Who do I contact for outages?**  
Your Super Admin or the operations contact in the deployment guide (`docs/technical/05-Installation-Deployment.md`).
