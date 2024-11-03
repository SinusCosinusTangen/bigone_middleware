import express, { Router } from 'express';
import AuthController from '../controllers/AuthController';

const router: Router = express.Router();

// Routes for the auth controller
router.get('/', AuthController.getPublicKey.bind(AuthController));                      // GET: /api/auth
router.get('/encrypt/:param', AuthController.encrypt.bind(AuthController));             // POST: /api/auth/encrypt
router.post('/register', AuthController.registerUser.bind(AuthController));             // POST: /api/auth/register
router.post('/login', AuthController.loginUser.bind(AuthController));                   // POST: /api/auth/login
router.post('/google', AuthController.authWithGoogle.bind(AuthController));             // POST: /api/auth/google
router.post('/validate-user', AuthController.validateGoogleUser.bind(AuthController));  // POST: /api/auth/validate-user
router.put('/update-user', AuthController.updateUser.bind(AuthController));             // PUT: /api/auth/update-user
router.post('/validate', AuthController.validateUser.bind(AuthController));             // POST: /api/auth/validate
router.post('/logout', AuthController.logoutUser.bind(AuthController));                 // POST: /api/auth/logout

export default router;
