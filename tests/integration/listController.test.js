require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const Board = require('../../models/Board');
const List = require('../../models/List');
const User = require('../../models/User');
const Card = require('../../models/Card');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('List Controller', () => {
  let token;
  let user;
  let board;

  beforeAll(async () => {
    const mongoURI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/test-db';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    // Clear collections
    await Promise.all([
      Board.deleteMany({}),
      User.deleteMany({}),
      List.deleteMany({}),
      Card.deleteMany({})
    ]);

    // Create test user
    user = await User.create({
      name: 'Test User',
      email: 'testuser@example.com',
      password: await bcrypt.hash('testpassword', 10),
      isVerified: true
    });

    // Generate token
    token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    // Create test board
    board = await Board.create({
      name: 'Test Board',
      owner: user._id,
      isPrivate: false
    });
  });

  describe('GET /lists/:boardId', () => {
    it('should retrieve lists for a specific board', async () => {
      // Create test lists
      await List.create([
        { 
          name: 'List 1', 
          boardId: board._id, 
          position: 0, 
          color: '#ff0000' 
        },
        { 
          name: 'List 2', 
          boardId: board._id, 
          position: 1, 
          color: '#00ff00' 
        }
      ]);

      const res = await request(app)
        .get(`/lists/${board._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].name).toBe('List 1');
      expect(res.body[0].position).toBe(0);
    });
  });

  describe('POST /lists/:boardId', () => {
    it('should create a new list', async () => {
      const listData = {
        name: 'New List',
        position: 0,
        color: '#0000ff'
      };

      const res = await request(app)
        .post(`/lists/${board._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(listData);

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('New List');
      expect(res.body.boardId.toString()).toBe(board._id.toString());
      expect(res.body.position).toBe(0);
      expect(res.body.color).toBe('#0000ff');
    });

    it('should return 400 for invalid list data', async () => {
      const invalidListData = {
        name: '', // Empty name
        position: 'not a number'
      };

      const res = await request(app)
        .post(`/lists/${board._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(invalidListData);

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('PUT /lists/:id', () => {
    it('should update an existing list', async () => {
      const list = await List.create({
        name: 'Original List',
        boardId: board._id,
        position: 0,
        color: '#ff0000'
      });

      const updateData = {
        name: 'Updated List',
        position: 1,
        color: '#00ff00'
      };

      const res = await request(app)
        .put(`/lists/${list._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated List');
      expect(res.body.position).toBe(1);
      expect(res.body.color).toBe('#00ff00');
    });

    it('should return 404 for non-existent list', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .put(`/lists/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Name' });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('List not found');
    });
  });

  describe('DELETE /lists/:id', () => {
    it('should delete a list and its associated cards', async () => {
      const list = await List.create({
        name: 'List to Delete',
        boardId: board._id,
        position: 0,
        color: '#ff0000'
      });

      // Create some cards in the list
      await Card.create([
        { 
          name: 'Card 1', 
          listId: list._id, 
          boardId: board._id,
          position: 0 
        },
        { 
          name: 'Card 2', 
          listId: list._id, 
          boardId: board._id,
          position: 1 
        }
      ]);

      const res = await request(app)
        .delete(`/lists/${list._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('List deleted');

      // Verify list is deleted
      const deletedList = await List.findById(list._id);
      expect(deletedList).toBeNull();

      // Verify associated cards are deleted
      const remainingCards = await Card.find({ listId: list._id });
      expect(remainingCards).toHaveLength(0);
    });

    it('should return 404 for non-existent list', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .delete(`/lists/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('List not found');
    });
  });
});