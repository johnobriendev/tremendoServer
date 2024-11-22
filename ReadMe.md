# Tremendo Server

## Overview
The backend API for the Tremendo Kanban application, built with Express.js and MongoDB. This server provides a robust API for managing kanban boards, supporting features like user authentication, board sharing, and email verification.

## Key Features
- 🔐 **Secure Authentication** with JWT and email verification
- 📋 **Complete Board Management** with lists, cards, and comments
- 👥 **Collaboration Features** including board sharing and invitations
- 📨 **Email Services** for registration verification and password resets
- 🛡️ **Rate Limiting** for enhanced security
- 🎨 **Customizable Boards** with templates and color options

## Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn
- A Resend account for email services
- A Google reCAPTCHA account

## Environment Variables
Create a `.env` file in the root directory:

```plaintext
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=your_verified_email

# Security
RECAPTCHA_SECRET_KEY=your_recaptcha_secret
FRONTEND_URL=http://localhost:3000
```

## Installation & Setup

1. **Clone and Install**:
    ```bash
    git clone https://github.com/yourusername/tremendoServer.git
    cd tremendoServer
    npm install
    ```

2. **Database Setup**:
    - Ensure MongoDB is running
    - The server will automatically create required collections

3. **Run the Server**:
    ```bash
    # Development with nodemon
    npm run dev

    # Production
    npm start
    ```

## API Documentation

### Authentication
All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### User Management
|
 Endpoint 
|
 Method 
|
 Description 
|
 Auth Required 
|
|
----------
|
---------
|
-------------
|
---------------
|
|
`/register`
|
 POST 
|
 Register new user 
|
 No 
|
|
`/login`
|
 POST 
|
 Authenticate user 
|
 No 
|
|
`/verify-email`
|
 GET 
|
 Verify email address 
|
 No 
|
|
`/request-password-reset`
|
 POST 
|
 Request password reset 
|
 No 
|
|
`/reset-password`
|
 POST 
|
 Reset password 
|
 No 
|

### Board Management
|
 Endpoint 
|
 Method 
|
 Description 
|
 Auth Required 
|
|
----------
|
---------
|
-------------
|
---------------
|
|
`/boards`
|
 GET 
|
 Get user's boards 
|
 Yes 
|
|
`/boards`
|
 POST 
|
 Create new board 
|
 Yes 
|
|
`/boards/:id`
|
 GET 
|
 Get board details 
|
 Yes 
|
|
`/boards/:id`
|
 PUT 
|
 Update board 
|
 Yes 
|
|
`/boards/:id`
|
 DELETE 
|
 Delete board 
|
 Yes 
|

### Lists and Cards
|
 Endpoint 
|
 Method 
|
 Description 
|
 Auth Required 
|
|
----------
|
---------
|
-------------
|
---------------
|
|
`/lists/:boardId`
|
 GET 
|
 Get board lists 
|
 Yes 
|
|
`/lists/:boardId`
|
 POST 
|
 Create new list 
|
 Yes 
|
|
`/cards/:boardId/cards`
|
 GET 
|
 Get board cards 
|
 Yes 
|
|
`/cards/:boardId/cards`
|
 POST 
|
 Create new card 
|
 Yes 
|

### Collaboration
|
 Endpoint 
|
 Method 
|
 Description 
|
 Auth Required 
|
|
----------
|
---------
|
-------------
|
---------------
|
|
`/invitations/boards/:boardId/invite`
|
 POST 
|
 Invite user 
|
 Yes 
|
|
`/invitations`
|
 GET 
|
 Get invitations 
|
 Yes 
|
|
`/invitations/:invitationId/respond`
|
 POST 
|
 Respond to invite 
|
 Yes 
|

## Security Features

### Authentication
- JWT-based authentication
- Password hashing with bcrypt
- Email verification requirement
- Password reset functionality

### Rate Limiting
- Registration endpoint: 5 requests per hour
- Login endpoint: 10 requests per minute
- Password reset: 3 requests per hour

### Authorization
- Board access control
- Collaborative permissions system
- Comment management restrictions

## Error Handling
The API uses consistent error responses:
```json
{
  "message": "Error description",
  "error": "Optional error details"
}
```

## Technologies Used
- **Express.js** - Node.js framework for building RESTful APIs
- **MongoDB** - NoSQL database for data storage
- **Mongoose** - ODM for MongoDB
- **Passport JWT** - For secure user authentication
- **bcrypt** - For password hashing
- **Resend** - For email verification and password reset
- **Google Recaptcha** - For increased registration security

## Contributing
1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.


<!-- # Tremendo Server

## Overview
This is the backend API for the Tremendo Kanban application, built with Express.js, Mongoose, and MongoDB. It provides all the necessary endpoints to manage boards, tasks, and user data.

## Prerequisites
Before running this project, make sure you have the following installed:
- **Node.js** (v14 or higher)
- **MongoDB**
- **npm** or **yarn**

## Environment Variables
Create a `.env` file in the root directory with the following variables:

```plaintext
PORT=5000
MONGODB_URI=
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

## Installation & Setup

1. **Clone the repository**:

    ```bash
    git clone 
    cd tremendoServer
    ```

2. **Install dependencies**:

    ```bash
    npm install
    ```

3. **Start the server**:

    - **Development mode**:

        ```bash
        npm run dev
        ```

    - **Production mode**:

        ```bash
        npm start
        ```

## API Endpoints

### User Routes (`user.js`)
These routes handle user management, including authentication, password reset, and email verification.

- **`POST /register`** - Register a new user (rate-limited).
- **`POST /login`** - Log in a user.
- **`POST /request-password-reset`** - Request a password reset link.
- **`POST /reset-password`** - Reset a user's password.
- **`POST /logout`** - Log out a user.
- **`GET /verify-email`** - Verify a user's email.
- **`POST /resend-verification`** - Resend the email verification link.
- **`GET /`** - Get authenticated user data.

### Board Routes (`board.js`)
These routes allow users to manage Kanban boards.

- **`GET /`** - Retrieve all boards for the authenticated user.
- **`POST /`** - Create a new board.
- **`GET /:id`** - Retrieve details of a specific board by ID.
- **`PUT /:id`** - Update a specific board.
- **`DELETE /:id`** - Delete a board.

### List Routes (`list.js`)
These routes manage lists within a specific board.

- **`GET /:boardId`** - Get all lists within a specified board.
- **`POST /:boardId`** - Create a new list within a specified board.
- **`PUT /:id`** - Update a specific list.
- **`DELETE /:id`** - Delete a specific list.

### Card Routes (`card.js`)
These routes manage cards within lists on a board.

- **`GET /:boardId/cards`** - Retrieve all cards within a specified board.
- **`POST /:boardId/cards`** - Create a new card within a board.
- **`GET /cards/:id`** - Retrieve details of a specific card by ID.
- **`PUT /cards/:id`** - Update a specific card.
- **`DELETE /cards/:id`** - Delete a specific card.
- **`POST /cards/:id/comments`** - Add a comment to a specific card.
- **`DELETE /cards/:cardId/comments/:commentId`** - Delete a comment from a specific card.

## Technologies Used
- **Express.js** - Node.js framework for building RESTful APIs.
- **MongoDB** - NoSQL database for data storage.
- **Mongoose** - ODM for MongoDB.
- **Passport JWT (JSON Web Tokens)** - For secure user authentication.
- **bcrypt** - For password hashing.
- **Resend** - For email verification and password reset.
- **Google Recaptcha** - For increased registration security.


## Running Tests
Run the following command to execute tests:

```bash
npm test
```


## Contributing
1. Fork the repository.
2. Create your feature branch: `git checkout -b feature/YourFeature`.
3. Commit your changes: `git commit -m 'Add some feature'`.
4. Push to the branch: `git push origin feature/YourFeature`.
5. Open a pull request.

## License
This project is licensed under the MIT License. -->
