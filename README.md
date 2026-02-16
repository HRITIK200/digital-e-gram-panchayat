# 🏛 Digital E-Gram Panchayat

A role-based Digital Governance Web Application that allows citizens to apply for government services online and enables staff & admin to manage applications efficiently.

---

## 🚀 Project Overview

Digital E-Gram Panchayat is a web-based government service portal that provides:

- 📝 Online certificate applications
- 📊 Real-time status tracking
- 👥 Role-based dashboards (Citizen, Staff, Admin)
- 🔐 Secure authentication using Firebase
- 🗂 Application approval & rejection system

This project demonstrates full-stack development using Firebase Authentication and Firestore Database.

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

### Backend (Firebase)
- Firebase Authentication
- Firestore Database
- Firebase Hosting (optional)

---

## 🔐 Authentication Flow

- User registers with Full Name, Email & Password
- Firebase Authentication creates account
- User role stored in Firestore
- Role-based redirect:
  - Citizen → User Dashboard
  - Staff → Staff Dashboard
  - Admin → Admin Dashboard

---

## 🗄 Firestore Database Structure

### 🔹 users collection
users/
userId
fullName
email
role

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

### Configure Firebase

Update `firebase-config.js` with your Firebase project credentials.

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
- Firebase Authentication
- Firestore CRUD operations
- Real-time UI updates
- Professional UI/UX design
- Modular JavaScript structure

---

## 👨‍💻 Author

**Hritik Pal**  
MCA Student | Full Stack Developer  
Passionate about building real-world government & enterprise applications.

---

## 📜 License

This project is for educational and portfolio purposes.

---


