# vidTube 🎬

vidTube is a scalable, feature-rich backend API designed for video content management platforms. Built with **Node.js**, **Express.js**, and **MongoDB**, it provides core functionalities similar to platforms like YouTube, supporting user management, video uploads, likes, comments, playlists, and subscriptions.

---

## 🌟 Key Features

✅ User authentication with JWT & refresh tokens  
✅ Secure password hashing with bcrypt  
✅ Video uploads with Cloudinary integration  
✅ Playlist creation & management  
✅ Commenting system for videos  
✅ Like/Dislike functionality  
✅ Subscription system for following creators  
✅ Robust API response & error handling structure  
✅ Modular, scalable folder architecture

---

## 🏗️ Project Architecture

```
vidTube/
├── public/                 # Temp storage for uploads
├── src/
│   ├── controllers/        # Request handling logic
│   ├── db/                 # Database connection
│   ├── middlewares/        # Authentication, error, multer
│   ├── models/             # Mongoose schemas (MongoDB collections)
│   ├── routes/             # API route definitions
│   ├── utils/              # Helper functions (error, response, cloudinary)
│   ├── app.js              # Express app configuration
│   ├── index.js            # Server entry point
├── .env                    # Environment variables (local)
├── package.json            # Project dependencies & scripts
```

---

## 💾 Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Auth**: JWT-based authentication
- **File Uploads**: Multer + Cloudinary
- **Other Utilities**: Bcrypt, Custom API response/error handlers

---

## 📂 MongoDB Collections & Schema Overview

Model link : [model link](https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj)

**1. User Model** (`models/user.models.js`)

```js
{
  username: String,
  email: String,
  password: String,
  avatar: String,
  subscribersCount: Number
}
```

**2. Video Model** (`models/video.models.js`)

```js
{
  title: String,
  description: String,
  fileUrl: String,
  thumbnail: String,
  createdBy: ObjectId (User),
  views: Number
}
```

**3. Playlist Model**

```js
{
  name: String,
  description: String,
  videos: [ObjectId (Video)],
  createdBy: ObjectId (User)
}
```

**4. Subscription Model**

```js
{
  subscriber: ObjectId (User),
  channel: ObjectId (User)
}
```

**5. Like/Comment Models** follow similar relational structures.

> All collections leverage **Mongoose schemas** ensuring type safety, validation, and relationships between documents.

---

## 🚀 Setup & Installation

### Prerequisites:

- Node.js v16+
- MongoDB instance (local or Atlas)
- Cloudinary account for media storage

### Install Dependencies:

```bash
git clone https://github.com/PARVE5H/vidTube.git
cd vidTube
npm install
```

### Environment Variables

Create a `.env` file:

```
PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Run Server

```bash
npm start
```

---

## 📡 API Endpoints Overview

| Method | Route                | Description            |
| ------ | -------------------- | ---------------------- |
| POST   | `/api/auth/register` | Register new user      |
| POST   | `/api/auth/login`    | Login & get JWT token  |
| POST   | `/api/videos`        | Upload new video       |
| GET    | `/api/videos`        | Fetch all videos       |
| POST   | `/api/playlists`     | Create playlist        |
| POST   | `/api/likes`         | Like/Unlike a video    |
| POST   | `/api/comments`      | Add comment to video   |
| POST   | `/api/subscriptions` | Subscribe to a creator |

🔑 Many routes are protected and require Authorization headers:

```
Authorization: Bearer <your_token>
```

---

## 🧩 Project Highlights

- Modular controller structure improves scalability
- Centralized error & response handling (`utils/`)
- Multer used for secure file uploads to Cloudinary
- MongoDB models maintain clear relationships (e.g., videos link to users)
- Production-ready structure with `.env` support

---

## 📈 Potential Future Enhancements

- Video streaming with range requests
- Comment threading & replies
- Email notifications for subscriptions
- Admin panel for content moderation
- Real-time updates with Socket.IO

---

## 🤝 Contributing

Pull requests welcome! For major changes, open an issue first to discuss proposals.

---

## 📄 License

MIT

---

## 🙋‍♂️ Author

**Parvesh Bansal**

## 🔗 Connect with Me

- 💼 [LinkedIn](https://www.linkedin.com/in/parvesh-bansal/)
- ✖️ [X (Twitter)](https://twitter.com/parve5h)
- 👨‍💻 [GitHub Profile](https://github.com/parve5h)
- 📧 [Email Me](mailto:parveshbansal063@gmail.com)
- 📸 [Instagram](https://www.instagram.com/parve5h)

---

> **Note:** This project is backend only. For full-stack functionality, a frontend client is required. Or for testing purpose one can use POSTMAN
