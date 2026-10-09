# 🏛 Digital E-Gram Panchayat

A role-based Digital Governance Web Application that allows citizens to apply for government services online and enables staff & admin to manage applications efficiently.

---

## 🚀 Project Overview

Digital E-Gram Panchayat is a web-based government service portal that provides:

- 📝 Online certificate applications
- 📊 Real-time status tracking
- 👥 Role-based dashboards (Citizen, Staff, Admin)
- 🔐 Secure authentication using Supabase
- 🗂 Application approval & rejection system

This project demonstrates full-stack development using Supabase Auth and PostgreSQL Database.

---

## 🧑‍💻 User Roles & Features

### 👤 Citizen Dashboard
- View available services
- Apply for services
- Prevent duplicate applications
- Track application status
- View applied date & service name

---

### 🧑‍💼 Staff Dashboard
- View Pending Applications
- Approve / Reject Applications
- Separate sections:
  - Pending Applications
  - Approved Applications
  - Rejected Applications
- View applicant name & service name

---

### 👨‍💼 Admin Dashboard
- Create new services
- View all services
- Delete services
- Role-based management

---

## 🛠 Tech Stack

### Frontend
- HTML5
- CSS3 (Custom Professional UI)
- JavaScript (ES Modules)

### Backend (Supabase)
- Supabase Auth
- Supabase PostgreSQL Database

---

## 🔐 Authentication Flow

- User registers with Full Name, Email & Password
- Supabase Auth creates account
- User role stored in public users table
- Role-based redirect:
  - Citizen → User Dashboard
  - Staff → Staff Dashboard
  - Admin → Admin Dashboard

---

## 🗄 Supabase Database Structure

### 🔹 users table
- `id` (uuid, primary key, references auth.users)
- `full_name` (text)
- `email` (text)
- `role` (text)
- `created_at` (timestamp)

### 🔹 services collection
services/
serviceId
serviceName
serviceDescription


### 🔹 applications collection
applications/
applicationId
userId
userName
serviceId
serviceName
status (Pending / Approved / Rejected)
createdAt


---

## 🎨 UI Features

- Professional gradient hero section
- Clean government-style layout
- Modern dashboard UI
- Status badges (Pending / Approved / Rejected)
- Responsive design
- Proper spacing & shadows

---

### Configure Supabase

Update `js/supabase-config.js` with your Supabase Project URL and Anon key.

---

### Run SQL Schema

Paste and execute the SQL schema details in the Supabase SQL Editor to create the necessary tables:

```sql
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  email text not null,
  role text not null default 'user',
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create table public.services (
  id uuid default gen_random_uuid() primary key,
  service_name text not null,
  service_description text not null,
  created_by uuid references public.users(id),
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create table public.applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade,
  user_name text not null,
  service_id uuid references public.services(id) on delete cascade,
  service_name text not null,
  status text not null default 'Pending',
  details text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create table public.logs (
  id bigint generated always as identity primary key,
  user_id uuid,
  action text not null,
  timestamp timestamptz default timezone('utc'::text, now()) not null
);

alter publish dbcontent_publication add table public.services, public.applications, public.logs;
```

---

## 📌 Future Improvements

- 📄 File upload support
- 🔍 Application search & filter
- 📊 Dashboard analytics
- 📧 Email notifications
- 📱 Fully mobile responsive UI
- 🌐 Deploy to Firebase Hosting

---

## 🎓 Learning Outcomes

This project demonstrates:

- Role-based access control
- Supabase Auth and Database
- Real-time UI updates via Postgres changes channel

---

## 👨‍💻 Author

**Hritik Pal**  
MCA Student | Full Stack Developer  
Passionate about building real-world government & enterprise applications.

---

## 📜 License

This project is for educational and portfolio purposes.

---


