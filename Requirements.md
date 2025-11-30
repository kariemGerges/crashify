�� CRASHIFY SYSTEM - SIMPLE REQUIREMENTS LIST
�� EMAIL PROCESSING
1. Monitor info@crashify.com.au every 15 minutes
2. Extract data from email body automatically
3. Download all attachments automatically
4. Filter spam emails with whitelist
5. Send auto-reply to rejected emails
6. Quarantine suspicious emails for review


�� IQ CONTROLS INTEGRATION
27. Copy button generates formatted data
28. Provide two formats: Human Readable and Tab-Separated
29. Display popup dialog with copy options
30. One-click copy to clipboard
31. Show success confirmation
�� CLAUDE AI INTEGRATION
32. Analyze damage photos automatically
33. Extract data from PDF quotes
34. Generate assessment reports
35. Review supplementary quotes
36. Provide approve/reject recommendations
�� ADMIN DASHBOARD
37. Show total assessments this month
38. Show pending count
39. Show in progress count
40. Show completed count
41. Show completion rate percentage
42. Show average days to complete
43. Show revenue this month
44. Show overdue count
45. Display pie chart - assessments by status
46. Display line graph - monthly volume trend
47. Display bar chart - top insurers
48. Display bar chart - top repairers
49. Display bar chart - average completion time
50. Display bar chart - revenue by month

51. Show live activity feed
52. Show alert banner for overdue items
53. Export data to Excel/CSV
54. Generate monthly PDF report
55. Email monthly report automatically
�� COMPLAINT SYSTEM
56. Public complaint form at /complaint
57. Accept complaints via email to complaints@crashify.com.au
58. Generate unique complaint number (COMP-YYYY-XXX)
59. Collect complainant details
60. Collect complaint category
61. Collect complaint description
62. Allow file attachments
63. Send auto-acknowledgment email
64. Track complaint status (New → Under Investigation → Resolved → Closed)
65. Display complaints dashboard
66. Show active complaints count
67. Show overdue complaints
68. Show average resolution time
69. Show complaint rate percentage
70. Allow admin to add internal notes
71. Allow admin to send messages to complainant
72. Allow admin to update status
73. Allow admin to close complaint
74. Link complaints to related assessments
75. Generate complaint analytics
76. Public tracking page at /complaint/track
77. Enforce SLA timeframes (Critical=4hrs, High=24hrs, Medium=48hrs,
Low=72hrs)

78. Alert when SLA at risk
79. Flag SLA breaches
�� WEB FORM INTAKE
80. Public form at /submit-assessment
81. Accept all standard assessment fields
82. Require minimum 3 photos
83. Validate email format
84. Validate phone format
85. Validate registration format
86. Google reCAPTCHA v3
87. Honeypot field for bots
88. Time-based validation (10 sec - 24 hrs)
89. Rate limiting (3/hour, 10/day per IP)
90. Check for duplicate submissions
91. Scan files for malware
92. Block spam keywords
93. Calculate spam score
94. Send confirmation email
95. Show confirmation page
96. Public tracking page at /track/[number]
�� PRIVATE LINK INTAKE
97. Generate unique secure tokens
98. Token format: 32-character alphanumeric
99. Link format: crashify.com.au/submit/[token]
100. Store token with client name, expiry, usage limit
101. Validate token on submission
102. Pre-fill client information from token
103. Track token usage count
104. Admin interface to manage tokens

105. Send token link via email
106. Disable/revoke tokens
�� MANUAL REVIEW QUEUE
107. Queue for suspicious submissions
108. Show spam score
109. Show reCAPTCHA score
110. Show reason for review
111. Allow admin to approve
112. Allow admin to reject
113. Allow admin to request more info
114. Email admin when new item in queue
�� NOTIFICATIONS
115. Email admin on new assessment
116. Email admin on overdue assessment
117. Email admin on new complaint
118. Email admin on system errors
119. Email client on submission received
120. Email client on status change
121. In-app notification bell icon
122. SMS for critical complaints (optional)
�� SECURITY
123. Login required for admin areas
124. Password hashing (bcrypt)
125. Session timeout after 2 hours
126. Lock account after 5 failed logins
127. CAPTCHA on login page
128. Role-based access (Super Admin, Admin, Assessor, Read-Only)
129. Encrypt sensitive data (AES-256)
130. HTTPS/SSL only

131. Sanitize all inputs (SQL injection protection)
132. CSRF tokens on forms
133. Store API keys in environment variables
134. Daily database backup
135. Retain backups for 30 days
136. Audit log all actions
137. Retain audit logs for 12 months
�� SUPPLEMENTARY REQUESTS
138. Detect &quot;supp&quot; keywords in emails
139. Link to original assessment
140. Increment supplementary count
141. Add supplementary amount to total
142. Save PDF to original folder
143. Send to Claude for review
144. Get AI recommendation
145. Update reference document
146. Add note to tracking sheet
147. Create &quot;Supplementary Requests&quot; tab
�� EXPORT &amp; API
148. Export to CSV
149. Export to Excel with formatting
150. Export to PDF
151. REST API endpoints for external integration
152. API key authentication
153. Rate limit API requests (100/hour)
154. Return JSON responses
155. Log all API access
�� MOBILE
156. Fully responsive design (320px - 1920px)

157. Mobile-first CSS framework
158. Touch-friendly buttons (min 44px)
159. Upload photos from mobile camera
160. QR code scanning support
161. GPS location tagging
162. Voice-to-text for notes
�� SEARCH &amp; FILTER
163. Global search bar
164. Search across all fields
165. Advanced filter panel
166. Filter by date range
167. Filter by status
168. Filter by insurer
169. Filter by assigned staff
170. Save filter preferences
171. Clear all filters button
⚙️ SYSTEM ADMIN
172. Email monitoring frequency setting
173. Data retention period setting
174. Default assigned user setting
175. SLA timeframes setting
176. API quota limits setting
177. Backup schedule setting
178. Notification preferences setting
179. Create new users
180. Edit user details
181. Change user roles
182. Deactivate users
183. Reset passwords

184. View user activity logs
185. Maintenance mode toggle
�� ANALYTICS
186. Total assessments count
187. Assessments by insurer
188. Assessments by repairer
189. Average completion time
190. Revenue by month
191. Completion rate
192. Email processing success rate
193. Data extraction accuracy
194. Intake method distribution
195. Spam blocked count
196. Token usage statistics
197. Complaint analytics
�� PERFORMANCE
198. Dashboard loads in &lt;2 seconds
199. Process email within 1 minute
200. Generate report within 5 seconds
201. Search results in &lt;1 second
202. Handle 100 assessments/day
203. 99.9% uptime
204. Daily backups
205. Recover from crash in 5 minutes
�� DELIVERABLES
206. Complete source code with comments
207. Database schema (SQL scripts)
208. Deployed system on crashify.com.au
209. Admin login credentials

210. API documentation
211. User manual (PDF)
212. 2-hour training session
213. 90-day warranty on bugs
214. Git repository access
215. Environment setup guide
--------------------------------------------------------------------------
For Fady - Start with:
✅ Local Server Setup
● All 215 core requirements
● Local MySQL database
● Local file storage
● Access via http://192.168.1.100/crashify
● Backups to external drive
✅ No recurring cloud costs
✅ 100% data control
✅ Upgrade to Australian cloud when business grows
Done! 434 total requirements covering everything. ��

�� ADDITIONAL REQUIREMENTS + LOCAL DATA STORAGE
�� ADDITIONAL FEATURES (Missing Items)
�� PHOTO MANAGEMENT
216. Automatic photo compression (reduce file size)
217. Remove duplicate photos automatically
218. Sort photos by damage area (front, rear, left, right)
219. Add photo annotations/markup tool
220. Before/after photo comparison
221. Photo gallery slideshow view

222. Bulk photo download (zip file)
223. Photo metadata extraction (date, GPS, camera)
�� REPORT FEATURES
224. Save draft reports (auto-save every 30 seconds)
225. Report version history (track changes)
226. Report templates library (customizable)
227. Digital signature on reports
228. PDF watermark with &quot;CRASHIFY CONFIDENTIAL&quot;
229. Report approval workflow (draft → review → approved)
230. Email report directly from system
231. Schedule report delivery (future date/time)
�� FINANCIAL TRACKING
232. Invoice generation from assessments
233. Track payment status (Pending, Paid, Overdue)
234. Send payment reminders automatically
235. Calculate GST automatically
236. Monthly revenue reports
237. Client billing history
238. Outstanding payments dashboard
239. Payment method tracking (EFT, Credit Card, Cheque)
240. Xero/MYOB integration option
�� CALENDAR &amp; SCHEDULING
241. Inspection calendar view
242. Book assessment appointments
243. Send calendar invites to clients
244. Reminder emails before appointments
245. Reschedule appointments
246. Block-out dates (holidays, leave)
247. Assessor availability tracking

248. Google Calendar sync
�� CLIENT PORTAL (Optional Future)
249. Client login access
250. View their assessments only
251. Upload additional photos after submission
252. Download completed reports
253. View invoice and payment history
254. Update contact details
255. Message Crashify directly
�� SMS NOTIFICATIONS
256. SMS on assessment received
257. SMS on report completed
258. SMS for appointment reminders
259. SMS for overdue payments
260. SMS for urgent complaints
�� WORKFLOW AUTOMATION
261. Auto-assign assessments to assessors (round-robin)
262. Auto-escalate overdue assessments
263. Auto-send follow-up emails (no response in 48hrs)
264. Auto-archive completed assessments (after 90 days)
265. Auto-delete spam submissions (after 30 days)
�� ADVANCED REPORTING
266. Custom report builder (drag &amp; drop)
267. Scheduled reports (weekly/monthly)
268. Benchmark against industry standards
269. Trend analysis (increasing/decreasing volume)
270. Client satisfaction survey (after completion)
271. Net Promoter Score (NPS) tracking
�� INTEGRATIONS

272. IQ Controls direct API integration (if available)
273. Outlook calendar integration
274. WhatsApp Business messaging
275. Zapier webhooks
276. Slack notifications
277. Microsoft Teams notifications
�� BRANDING &amp; CUSTOMIZATION
278. Upload Crashify logo
279. Customize email templates with branding
280. Custom domain email (reports@crashify.com.au)
281. Branded PDF reports
282. Custom color scheme (blue theme)
283. White-label client portals
�� TEMPLATES &amp; STANDARDS
284. Pre-defined damage categories
285. Standard repair cost estimates library
286. Common vehicle makes/models database
287. Insurer contact database
288. Repairer contact database
289. Quick-fill templates (common vehicles)
�� QUALITY CONTROL
290. Peer review system (second assessor checks)
291. Quality score per assessment
292. Flag assessments for quality review
293. Assessor performance metrics
294. Client feedback ratings
295. Repairer rating system
�� COMMUNICATION HUB
296. All emails in one thread per assessment

297. Internal chat/notes between staff
298. Email to SMS forwarding
299. Voicemail to email transcription
300. Call recording integration (optional)
��️ COMPLIANCE &amp; LEGAL
301. Terms &amp; Conditions acceptance tracking
302. Privacy policy compliance (Australian Privacy Act)
303. GDPR compliance (for EU clients)
304. Data retention policy enforcement
305. Right to deletion (GDPR Article 17)
306. Data breach notification system
307. Insurance professional indemnity tracking
�� BUSINESS INTELLIGENCE
308. Profit margin per assessment
309. Most profitable insurers
310. Most profitable vehicle types
311. Assessor efficiency metrics
312. Peak business hours analysis
313. Marketing source tracking (where clients come from)

�� LOCAL DATA STORAGE (MANDATORY START)
�� LOCAL SERVER REQUIREMENTS
Database Storage
314. Install MySQL/PostgreSQL on local server
315. Store ALL database on local server (IP: 192.168.x.x)
316. Database location: /var/lib/mysql (Linux) or C:\MySQL\Data (Windows)
317. No external database connections
318. Database encryption at rest
319. Database access restricted to localhost only

File Storage (Photos &amp; Documents)
320. Store ALL files on local server hard drive
321. File location: /var/www/crashify/storage/assessments/
322. Minimum 500GB dedicated storage space
323. Daily incremental backups to external hard drive
324. Weekly full backups to external hard drive
325. Monthly backup to offsite location (physical drive at Fady&#39;s home)
326. RAID 1 configuration (mirrored drives for redundancy)
Application Server
327. Host web application on local server
328. Apache/Nginx web server on local machine
329. PHP/Python runtime on local machine
330. Access via local IP: http://192.168.1.100/crashify
331. Or local domain: http://crashify.local
Network Configuration
332. Local network access only (192.168.x.x range)
333. No port forwarding to internet (initially)
334. VPN access for remote work (optional)
335. Firewall rules: Block all except port 80/443 from local network
Email Processing (Local)
336. Email client checks info@crashify.com.au via IMAP
337. Downloads emails to local server
338. Processes locally (no cloud email processing)
339. Stores email data in local database
340. Email attachments saved to local storage
Backup Strategy (Local)
341. Primary storage: Local server HDD/SSD
342. Backup 1: External USB hard drive (daily)
343. Backup 2: Network Attached Storage (NAS) if available

344. Backup 3: External drive kept at home (weekly swap)
345. Backup retention: 90 days local, 12 months offsite
Security (Local)
346. Physical server security (locked room/cabinet)
347. BIOS password protection
348. Full disk encryption (BitLocker/LUKS)
349. Local firewall (Windows Firewall/iptables)
350. Antivirus on server
351. Weekly security updates
352. Access control (only Fady has admin access)
Performance (Local)
353. Minimum 16GB RAM
354. Minimum 4-core processor (Intel i5 or equivalent)
355. SSD for database (faster performance)
356. Gigabit ethernet connection
357. UPS (Uninterruptible Power Supply) for server

☁️ FUTURE: AUSTRALIAN CLOUD MIGRATION (Phase 2)
When Ready to Move to Cloud
Australian Cloud Providers (Data Sovereignty)
358. Option 1: AWS Sydney Region (ap-southeast-2)
359. Option 2: Microsoft Azure Australia East (Sydney)
360. Option 3: Google Cloud Australia (Sydney)
361. Option 4: Vultr Sydney
362. Option 5: DigitalOcean Sydney
363. Option 6: Australian-owned: Macquarie Cloud Services
364. Option 7: Australian-owned: Hostworks
Migration Requirements
365. Export all data from local database

366. Upload all files to Australian cloud storage
367. Verify data integrity (checksums)
368. Test all functionality on cloud
369. Parallel run (local + cloud for 2 weeks)
370. DNS switchover to cloud
371. Decommission local server (after 30-day verification)
Cloud Data Storage (Australia Only)
372. Database: Amazon RDS Sydney OR Azure SQL Australia East
373. Files: Amazon S3 Sydney OR Azure Blob Storage Australia
374. Backups: AWS Glacier Sydney OR Azure Archive Australia
375. Email: Microsoft 365 Australia OR Google Workspace Australia
376. AI Processing: Keep Claude API (already compliant)
Australian Data Compliance
377. Confirm all data stored in Australian data centers
378. No data replication outside Australia
379. Australian customer support only
380. Compliance with Australian Privacy Act 1988
381. Compliance with Notifiable Data Breaches scheme
382. ISO 27001 certified cloud provider
383. SOC 2 Type II certified cloud provider
Cloud Cost Estimates (Monthly)
384. Small setup (0-50 assessments/month): $50-100/month
385. Medium setup (50-200 assessments/month): $150-300/month
386. Large setup (200+ assessments/month): $400-800/month
Cloud Migration Timeline
387. Planning: 1 week
388. Data export: 1 day
389. Cloud setup: 3 days
390. Data migration: 2 days

391. Testing: 1 week
392. Parallel run: 2 weeks
393. Go-live: 1 day
394. Total: 4-5 weeks

�� DATA SECURITY REQUIREMENTS (Local &amp; Cloud)
Encryption
395. Database encryption: AES-256
396. File encryption: AES-256
397. Email encryption: TLS 1.3
398. Backup encryption: AES-256
399. Password hashing: bcrypt (cost factor 12)
400. API token encryption: SHA-256
Access Control
401. Multi-factor authentication (MFA) for admin
402. IP whitelist for admin access
403. Geographic restriction (Australia only)
404. Session timeout: 2 hours
405. Password policy: min 12 characters, upper+lower+number+symbol
406. Password expiry: 90 days (optional)
Monitoring &amp; Logging
407. Log all login attempts
408. Log all data access
409. Log all data modifications
410. Log all exports
411. Log all API calls
412. Detect brute force attempts
413. Detect suspicious activity patterns
414. Real-time security alerts

Compliance
415. Australian Privacy Principles (APP) compliant
416. Notifiable Data Breaches scheme ready
417. GDPR compliant (for any EU clients)
418. PCI DSS compliant (if storing payment info)
419. Regular security audits (quarterly)
420. Penetration testing (annually)
421. Vulnerability scanning (monthly)

�� DISASTER RECOVERY
Local Server Disaster Recovery
422. Document server rebuild procedure
423. Keep server configuration backup
424. Keep application installation files
425. Test restoration quarterly
426. Recovery Time Objective (RTO): 4 hours
427. Recovery Point Objective (RPO): 24 hours
428. Emergency contact list (IT support)
Data Loss Prevention
429. Automatic backup verification
430. Test restore monthly
431. Backup checksums
432. Version control for code
433. Database transaction logs
434. Point-in-time recovery capability
�� DEPLOYMENT OPTIONS

Australian Cloud (Future)
Provider: AWS Sydney or Azure Australia

● Cost: $0 setup
● Monthly: $100-500 (depending on usage)
● Data: 100% in Australia (Sydney data center)
● Speed: Fast (good internet required)
● Internet dependency: 100% (no internet = no access)
● Scaling: Unlimited
✅ RECOMMENDED APPROACH
START (Week 1-8):
1. Build core system (Requirements 1-215)
2. Deploy on local server (Requirements 314-357)
3. Implement security (Requirements 395-421)
4. Total: Local system, all data on-premises
ENHANCE (Month 3-4):
6. Add photo management (216-223)
7. Add financial tracking (232-240)
8. Add calendar (241-248)
MIGRATE (Month 6-12):
10. Move to Australian cloud when ready
11. Keep local server as backup
SCALE (Year 2+):
13. Add client portal
14. Add advanced integrations
15. Add business intelligence