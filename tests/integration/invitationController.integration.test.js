// invitationController.test.js
require('dotenv').config();
const request = require('supertest');
const app = require('../../app');
const mongoose = require('mongoose');
const Board = require('../../models/Board');
const User = require('../../models/User');
const Invitation = require('../../models/Invitation');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Invitation Controller', () => {
  let boardOwner;
  let boardOwnerToken;
  let invitedUser;
  let invitedUserToken;
  let testBoard;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI_TEST);
  });

  beforeEach(async () => {
    await Promise.all([
      Board.deleteMany({}),
      User.deleteMany({}),
      Invitation.deleteMany({})
    ]);

    boardOwner = await User.create({
      name: 'Board Owner',
      email: `owner${Date.now()}@example.com`,
      password: await bcrypt.hash('testpassword', 10),
      isVerified: true
    });
    boardOwnerToken = jwt.sign({ id: boardOwner._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    invitedUser = await User.create({
      name: 'Invited User',
      email: `invited${Date.now()}@example.com`,
      password: await bcrypt.hash('testpassword', 10),
      isVerified: true
    });
    invitedUserToken = jwt.sign({ id: invitedUser._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    testBoard = await Board.create({
      name: 'Test Board',
      owner: boardOwner._id,
      isPrivate: false,
      description: 'Test Board for Invitations'
    });
  });

  describe('POST /invitations/boards/:boardId/invite', () => {
    it('should successfully create an invitation', async () => {
      const res = await request(app)
        .post(`/invitations/boards/${testBoard._id}/invite`)
        .set('Authorization', `Bearer ${boardOwnerToken}`)
        .send({ email: invitedUser.email });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Invitation sent successfully');
    });

    it('should return 403 if board does not exist or user is not owner', async () => {
      const nonExistentBoardId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .post(`/invitations/boards/${nonExistentBoardId}/invite`)
        .set('Authorization', `Bearer ${boardOwnerToken}`)
        .send({ email: invitedUser.email });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Only board owner can perform this action');
    });

    it('should return 403 if user is not board owner', async () => {
      const res = await request(app)
        .post(`/invitations/boards/${testBoard._id}/invite`)
        .set('Authorization', `Bearer ${invitedUserToken}`)
        .send({ email: 'another@example.com' });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Only board owner can perform this action');
    });
  });

  describe('GET /invitations', () => {
    it('should return pending invitations for authenticated user', async () => {
      await Invitation.create({
        board: testBoard._id,
        inviter: boardOwner._id,
        invitee: invitedUser._id,
        status: 'pending'
      });

      const res = await request(app)
        .get('/invitations')
        .set('Authorization', `Bearer ${invitedUserToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body).toHaveLength(1);
    });
  });
});

// require('dotenv').config();
// const request = require('supertest');
// const app = require('../../app');
// const mongoose = require('mongoose');
// const Board = require('../../models/Board');
// const User = require('../../models/User');
// const Invitation = require('../../models/Invitation');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

// // Use existing test database
// beforeAll(async () => {
//   await mongoose.connect(process.env.MONGODB_URI_TEST, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   });
// });

// afterAll(async () => {
//   await mongoose.disconnect();
// });

// describe('Invitation Controller', () => {
//   let boardOwner;
//   let boardOwnerToken;
//   let invitedUser;
//   let invitedUserToken;
//   let testBoard;

//   beforeEach(async () => {
//     // Clear the database before each test
//     await Promise.all([
//       Board.deleteMany({}),
//       User.deleteMany({}),
//       Invitation.deleteMany({})
//     ]);

//     // Create board owner
//     boardOwner = await User.create({
//       name: 'Board Owner',
//       email: 'owner@example.com',
//       password: await bcrypt.hash('testpassword', 10),
//       isVerified: true
//     });
//     boardOwnerToken = jwt.sign({ id: boardOwner._id }, process.env.JWT_SECRET, {
//       expiresIn: '1h',
//     });

//     // Create invited user
//     invitedUser = await User.create({
//       name: 'Invited User',
//       email: 'invited@example.com',
//       password: await bcrypt.hash('testpassword', 10),
//       isVerified: true
//     });
//     invitedUserToken = jwt.sign({ id: invitedUser._id }, process.env.JWT_SECRET, {
//       expiresIn: '1h',
//     });

//     // Create test board
//     testBoard = await Board.create({
//       name: 'Test Board',
//       owner: boardOwner._id,
//       isPrivate: false,
//       description: 'Test Board for Invitations'
//     });
//   });

//   describe('POST /invitations/boards/:boardId/invite', () => {
//     it('should successfully create an invitation', async () => {
//       const res = await request(app)
//         .post(`/invitations/boards/${testBoard._id}/invite`)
//         .set('Authorization', `Bearer ${boardOwnerToken}`)
//         .send({ email: invitedUser.email });

//       expect(res.status).toBe(200);
//       expect(res.body.message).toBe('Invitation sent successfully');

//       // Verify invitation was created in database
//       const invitation = await Invitation.findOne({
//         board: testBoard._id,
//         invitee: invitedUser._id
//       });
//       expect(invitation).toBeTruthy();
//       expect(invitation.status).toBe('pending');
//     });

//     it('should return 404 if board does not exist', async () => {
//       const fakeId = boardOwner._id;
//       const res = await request(app)
//         .post(`/invitations/boards/${fakeId}/invite`)
//         .set('Authorization', `Bearer ${boardOwnerToken}`)
//         .send({ email: invitedUser.email });

//       expect(res.status).toBe(404);
//       expect(res.body.message).toBe('Board not found');
//     });

//     it('should return 403 if user is not board owner', async () => {
//       const res = await request(app)
//         .post(`/invitations/boards/${testBoard._id}/invite`)
//         .set('Authorization', `Bearer ${invitedUserToken}`)
//         .send({ email: 'another@example.com' });

//       expect(res.status).toBe(403);
//       expect(res.body.message).toBe('Only board owner can perform this action');
//     });

//     it('should prevent duplicate pending invitations', async () => {
//       // Create existing invitation
//       await Invitation.create({
//         board: testBoard._id,
//         inviter: boardOwner._id,
//         invitee: invitedUser._id,
//         status: 'pending'
//       });

//       const res = await request(app)
//         .post(`/invitations/boards/${testBoard._id}/invite`)
//         .set('Authorization', `Bearer ${boardOwnerToken}`)
//         .send({ email: invitedUser.email });

//       expect(res.status).toBe(400);
//       expect(res.body.message).toBe('Invitation already sent to this user');
//     });

//     it('should return 404 if invited user does not exist', async () => {
//       const res = await request(app)
//         .post(`/invitations/boards/${testBoard._id}/invite`)
//         .set('Authorization', `Bearer ${boardOwnerToken}`)
//         .send({ email: 'nonexistent@example.com' });

//       expect(res.status).toBe(404);
//       expect(res.body.message).toBe('User not found');
//     });
//   });

//   describe('GET /invitations', () => {
//     it('should return all pending invitations for authenticated user', async () => {
//       // Create test invitations
//       await Invitation.create({
//         board: testBoard._id,
//         inviter: boardOwner._id,
//         invitee: invitedUser._id,
//         status: 'pending'
//       });

//       const res = await request(app)
//         .get('/invitations')
//         .set('Authorization', `Bearer ${invitedUserToken}`);

//       expect(res.status).toBe(200);
//       expect(Array.isArray(res.body)).toBeTruthy();
//       expect(res.body).toHaveLength(1);
//       expect(res.body[0].board._id.toString()).toBe(testBoard._id.toString());
//       expect(res.body[0].inviter._id.toString()).toBe(boardOwner._id.toString());
//     });

//     it('should return empty array when no pending invitations exist', async () => {
//       const res = await request(app)
//         .get('/invitations')
//         .set('Authorization', `Bearer ${invitedUserToken}`);

//       expect(res.status).toBe(200);
//       expect(Array.isArray(res.body)).toBeTruthy();
//       expect(res.body).toHaveLength(0);
//     });
//   });

//   describe('POST /invitations/:invitationId/respond', () => {
//     let testInvitation;

//     beforeEach(async () => {
//       testInvitation = await Invitation.create({
//         board: testBoard._id,
//         inviter: boardOwner._id,
//         invitee: invitedUser._id,
//         status: 'pending'
//       });
//     });

//     it('should successfully accept an invitation', async () => {
//       const res = await request(app)
//         .post(`/invitations/${testInvitation._id}/respond`)
//         .set('Authorization', `Bearer ${invitedUserToken}`)
//         .send({ accept: true });

//       expect(res.status).toBe(200);
//       expect(res.body.message).toBe('Invitation accepted successfully');

//       // Verify invitation status updated
//       const updatedInvitation = await Invitation.findById(testInvitation._id);
//       expect(updatedInvitation.status).toBe('accepted');

//       // Verify user added to board collaborators
//       const updatedBoard = await Board.findById(testBoard._id);
//       expect(updatedBoard.collaborators).toContainEqual(invitedUser._id);
//     });

//     it('should successfully reject an invitation', async () => {
//       const res = await request(app)
//         .post(`/invitations/${testInvitation._id}/respond`)
//         .set('Authorization', `Bearer ${invitedUserToken}`)
//         .send({ accept: false });

//       expect(res.status).toBe(200);
//       expect(res.body.message).toBe('Invitation rejected successfully');

//       // Verify invitation status updated
//       const updatedInvitation = await Invitation.findById(testInvitation._id);
//       expect(updatedInvitation.status).toBe('rejected');

//       // Verify user not added to board collaborators
//       const updatedBoard = await Board.findById(testBoard._id);
//       expect(updatedBoard.collaborators || []).not.toContainEqual(invitedUser._id);
//     });

//     it('should return 403 if user is not the invitee', async () => {
//       const res = await request(app)
//         .post(`/invitations/${testInvitation._id}/respond`)
//         .set('Authorization', `Bearer ${boardOwnerToken}`)
//         .send({ accept: true });

//       expect(res.status).toBe(403);
//       expect(res.body.message).toBe('Not authorized to manage this invitation');
//     });

//     it('should return 404 if invitation does not exist', async () => {
//       const fakeId = new mongoose.Types.ObjectId();
//       const res = await request(app)
//         .post(`/invitations/${fakeId}/respond`)
//         .set('Authorization', `Bearer ${invitedUserToken}`)
//         .send({ accept: true });

//       expect(res.status).toBe(404);
//       expect(res.body.message).toBe('Invitation not found');
//     });
//   });
// });