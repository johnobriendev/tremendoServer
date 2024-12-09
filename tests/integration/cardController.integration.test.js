require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app'); 
const Card = require('../../models/Card');
const User = require('../../models/User'); 
const Board = require('../../models/Board');
const List = require('../../models/List');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs')

const testDatabaseUri = process.env.MONGODB_URI_TEST;


describe('Card Controller Integration Tests', () => {
  let token;
  let user;
  let board;
  let list;
  let cardId;

  beforeAll(async () => {
    await mongoose.connect(testDatabaseUri);
  });

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Board.deleteMany({}),
      List.deleteMany({}),
      Card.deleteMany({})
    ]);
    
    user = await User.create({ 
      name: 'Test User',
      email: `testuser${Date.now()}@example.com`,
      password: await bcrypt.hash('password123', 10),
      isVerified: true
    });
    
    board = await Board.create({
      name: 'Test Board',
      owner: user._id,
      isPrivate: false
    });
    
    list = await List.create({
      name: 'Test List',
      boardId: board._id,
      position: 0
    });
    
    token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  describe('POST /cards/:boardId/cards', () => {
    it('should create a new card successfully', async () => {
      const response = await request(app)
        .post(`/cards/${board._id}/cards`)  // Use board._id instead of boardId
        .set('Authorization', `Bearer ${token}`)
        .send({
          listId: list._id,  // Use list._id instead of listId
          name: 'Test Card',
          description: 'A card for testing',
          position: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Test Card');
      expect(response.body.description).toBe('A card for testing');
      cardId = response.body._id;
    });

    it('should fail if required fields are missing', async () => {
      const response = await request(app)
        .post(`/cards/${board._id}/cards`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Missing name and listId',
          position: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Card Comments', () => {
    let testCard;

    beforeEach(async () => {
      testCard = await Card.create({
        name: 'Test Card',
        listId: list._id,
        boardId: board._id,
        position: 0
      });
    });

    it('should add a comment to a card', async () => {
      const response = await request(app)
        .post(`/cards/${testCard._id}/comments`)  // Use testCard._id
        .set('Authorization', `Bearer ${token}`)
        .send({
          text: 'This is a test comment'
        });

      expect(response.status).toBe(200);
      expect(response.body.comments[0].text).toBe('This is a test comment');
    });

    it('should delete a comment from a card', async () => {
      // First, add a comment
      const addResponse = await request(app)
        .post(`/cards/${testCard._id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          text: 'Comment to be deleted'
        });

      const commentId = addResponse.body.comments[0]._id;

      // Then delete the comment
      const response = await request(app)
        .delete(`/cards/${testCard._id}/comments/${commentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });

    it('should return 404 if comment not found for deletion', async () => {
      const response = await request(app)
        .delete(`/cards/${testCard._id}/comments/invalidCommentId`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /cards/:id', () => {
    let card;

    beforeEach(async () => {
      card = await Card.create({
        name: 'Test Card',
        listId: list._id,
        boardId: board._id,
        position: 0
      });
    });

    it('should update an existing card', async () => {
      const response = await request(app)
        .put(`/cards/${card._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Card',
          description: 'Updated description',
          position: 2,
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Card');
      expect(response.body.description).toBe('Updated description');
      expect(response.body.position).toBe(2);
    });
  });

  describe('DELETE /cards/:id', () => {
    let card;

    beforeEach(async () => {
      card = await Card.create({
        name: 'Test Card',
        listId: list._id,
        boardId: board._id,
        position: 0
      });
    });

    it('should delete an existing card', async () => {
      const response = await request(app)
        .delete(`/cards/${card._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Card removed');
    });

    it('should return 404 if the card does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/cards/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});


// require('dotenv').config();
// const request = require('supertest');
// const mongoose = require('mongoose');
// const app = require('../../app'); 
// const Card = require('../../models/Card');
// const User = require('../../models/User'); 
// const Board = require('../../models/Board');
// const List = require('../../models/List');
// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs')

// const testDatabaseUri = process.env.MONGODB_URI_TEST;

// describe('Card Controller Integration Tests', () => {
//   let token;
//   let user;
//   let boardId;
//   let listId;
//   let cardId;

//   beforeAll(async () => {
//     await mongoose.connect(testDatabaseUri);

//   });

//   beforeEach(async () => {
//     // Clear all collections before each test
//     await Promise.all([
//       User.deleteMany({}),
//       Board.deleteMany({}),
//       List.deleteMany({}),
//       Card.deleteMany({})
//     ]);
    
//     // Create test user
//     user = await User.create({ 
//       name: 'Test User',
//       email: `testuser${Date.now()}@example.com`, // Make email unique
//       password: await bcrypt.hash('password123', 10),
//       isVerified: true
//     });
    
//     // Create board
//     board = await Board.create({
//       name: 'Test Board',
//       owner: user._id,
//       isPrivate: false
//     });
    
//     // Create list
//     list = await List.create({
//       name: 'Test List',
//       boardId: board._id,
//       position: 0
//     });
    
//     token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
//   });

//   // afterAll(async () => {
//   //   // Clean up test data and close the connection
//   //   await Card.deleteMany({});
//   //   await User.deleteMany({});
//   //   await mongoose.connection.close();
//   // });

//   describe('POST /cards/:boardId/cards - Create a new card', () => {
//     it('should create a new card successfully', async () => {
//       const response = await request(app)
//         .post(`/cards/${boardId}/cards`)
//         .set('Authorization', `Bearer ${token}`)
//         .send({
//           listId,
//           name: 'Test Card',
//           description: 'A card for testing',
//           position: 1,
//         });

//       expect(response.status).toBe(201);
//       expect(response.body.name).toBe('Test Card');
//       expect(response.body.description).toBe('A card for testing');
      
//       // Ensure cardId is properly set
//       cardId = response.body._id;
//       console.log('Created cardId:', cardId);  // Log cardId to check if it’s correctly set

//       // Validate that cardId is a valid ObjectId
//       const isValidId = mongoose.Types.ObjectId.isValid(cardId);
//       console.log('Is valid cardId?', isValidId);
//       expect(isValidId).toBe(true);  // Assert cardId is a valid ObjectId
//     });

//     it('should fail if required fields are missing', async () => {
//       const response = await request(app)
//         .post(`/cards/${boardId}/cards`)
//         .set('Authorization', `Bearer ${token}`)
//         .send({
//           description: 'Missing name and listId',
//           position: 1,
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.errors).toBeDefined();
//     });
//   });

//   describe('PUT /cards/:id - Update a card', () => {
//     it('should update an existing card', async () => {
//       // Ensure cardId is defined and valid before making the request
//       if (!cardId || !mongoose.Types.ObjectId.isValid(cardId)) {
//         throw new Error('Invalid cardId for PUT request');
//       }

//       const response = await request(app)
//         .put(`/cards/${cardId}`)
//         .set('Authorization', `Bearer ${token}`)
//         .send({
//           name: 'Updated Card',
//           description: 'Updated description',
//           position: 2,
//         });

//       expect(response.status).toBe(200);
//       expect(response.body.name).toBe('Updated Card');
//       expect(response.body.description).toBe('Updated description');
//       expect(response.body.position).toBe(2); // Ensure position is updated
//     });
//   });

//   describe('DELETE /cards/:id - Delete a card', () => {
//     it('should delete an existing card', async () => {
//       if (!cardId || !mongoose.Types.ObjectId.isValid(cardId)) {
//         throw new Error('Invalid cardId for DELETE request');
//       }

//       const response = await request(app)
//         .delete(`/cards/${cardId}`)
//         .set('Authorization', `Bearer ${token}`);

//       expect(response.status).toBe(200);
//       expect(response.body.message).toBe('Card removed');
//     });

//     it('should return 404 if the card does not exist', async () => {
//       const response = await request(app)
//         .delete(`/cards/${cardId}`)
//         .set('Authorization', `Bearer ${token}`);

//       expect(response.status).toBe(404);
//     });
//   });

//   describe('Card Comments', () => {
//     let testCard;

//     beforeEach(async () => {
//       testCard = await Card.create({
//         name: 'Test Card',
//         listId: list._id,
//         boardId: board._id,
//         position: 0
//       });
//     });

//     it('should add a comment to a card', async () => {
//       const response = await request(app)
//         .post(`/cards/${cardWithCommentsId}/comments`)
//         .set('Authorization', `Bearer ${token}`)
//         .send({
//           text: 'This is a test comment',
//         });
//         console.log(response.status);  // Print status to debug
//         console.log(response.body);  

//       expect(response.status).toBe(200);
//       expect(response.body.comments[0].text).toBe('This is a test comment');
//       commentId = response.body.comments[0]._id;
//     });

//     it('should delete a comment from a card', async () => {
//       // First, add a comment
//       const addResponse = await request(app)
//         .post(`/cards/${cardWithCommentsId}/comments`)
//         .set('Authorization', `Bearer ${token}`)
//         .send({
//           text: 'Comment to be deleted',
//         });

//       commentId = addResponse.body.comments[0]._id;

//       // Then delete the comment
//       const response = await request(app)
//         .delete(`/cards/${cardWithCommentsId}/comments/${commentId}`)
//         .set('Authorization', `Bearer ${token}`);

//       expect(response.status).toBe(200);
//     });

//     it('should return 200 if comment not found for deletion', async () => {
//       const response = await request(app)
//         .delete(`/cards/${cardWithCommentsId}/comments/invalidCommentId`)
//         .set('Authorization', `Bearer ${token}`);

//       expect(response.status).toBe(200);
//     });
//   });
// });



