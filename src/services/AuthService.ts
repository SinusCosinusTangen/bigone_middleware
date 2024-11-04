import User from '../models/User';
import jwt from 'jsonwebtoken';
import { UserRequest, AuthDTO, UserDTO } from '../models/AuthDTO';
import { CryptoDTO } from '../models/CryptoDTO';
import { ICryptoService } from './ICryptoService';
import { UserExistsException, WrongPasswordException, NotFoundException, ExpiredTokenException } from '../exceptions/exceptions';
import { compareSync, hashSync } from 'bcryptjs';
import { IAuthService } from './IAuthService';
import { Op } from 'sequelize';
import { redisClient } from '../config/Redis';
import * as admin from 'firebase-admin';
import { LoginMethodConstant, RoleConstant } from '../constants/ServiceConstant'

export class AuthService implements IAuthService {
    private cryptoService: ICryptoService;

    constructor(cryptoService: ICryptoService) {
        this.cryptoService = cryptoService;
    }

    public async getEncryptedPassword(password: string): Promise<string> {
        const publicKeyDTO = await this.cryptoService.getPublicKey();

        if (!publicKeyDTO || !publicKeyDTO.publicKey) {
            throw new Error("Public key is undefined or null");
        }

        return this.cryptoService.encryptMessage(publicKeyDTO.publicKey, password);
    }

    public async getPublicKey(): Promise<CryptoDTO> {
        const publicKeyDTO = await this.cryptoService.getPublicKey();

        if (!publicKeyDTO || !publicKeyDTO.publicKey) {
            throw new Error("Public key is undefined or null");
        }

        return publicKeyDTO;
    }

    public async registerUser(request: UserRequest): Promise<UserDTO> {
        if (!request.username || !request.email) {
            throw new Error('USERNAME OR EMAIL IS EMPTY');
        }

        if (!request.password && !request.loginMethod) {
            throw new Error('PASSWORD IS EMPTY');
        }

        const existingUser = await User.findOne({
            where: {
                [Op.or]: [
                    { username: request.username },
                    { email: request.email }
                ]
            }
        });

        if (existingUser) {
            throw new UserExistsException();
        }

        const user = await User.create({
            username: request.username,
            email: request.email,
            password: request.password ? hashSync(this.cryptoService.decryptMessage(request.password), 10) : "",
            role: RoleConstant.GUEST,
            loginMethod: request.loginMethod || LoginMethodConstant.USERNAME_EMAIL,
            lastLoggedOn: new Date(),
            firebaseUid: request.firebaseUid,
            createdDate: new Date(),
            lastModified: new Date(),
        });

        return this.userToUserDTO(user);
    }

    public async loginUser(request: AuthDTO): Promise<UserDTO> {
        const user = await User.findOne({
            where: {
                [Op.and]: [
                    {
                        [Op.or]: [
                            { username: request.usernameEmail },
                            { email: request.usernameEmail }
                        ]
                    },
                    { loginMethod: LoginMethodConstant.USERNAME_EMAIL }
                ]
            }
        });

        if (request.loginMethod === LoginMethodConstant.GOOGLE) {
            throw new WrongPasswordException();
        } else if (!user || !user.password) {
            throw new NotFoundException();
        }

        if (request.password && compareSync(this.cryptoService.decryptMessage(request.password), user.password)) {
            user.lastLoggedOn = new Date();
            await user.save();

            const token = await this.generateJwtToken(user);
            const authDTO = this.userToUserDTO(user);
            authDTO.token = token;

            return authDTO;
        }

        throw new WrongPasswordException();
    }

    public async updateUser(request: UserRequest): Promise<UserDTO> {
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { username: request.username },
                    { email: request.email }
                ]
            }
        });

        if (!user) {
            throw new NotFoundException();
        }

        if (request.password && user.password) {
            const decryptedPassword = this.cryptoService.decryptMessage(request.password);
            if (!compareSync(decryptedPassword, user.password)) {
                throw new WrongPasswordException();
            }
        }

        user.email = request.email || user.email;
        user.loginMethod = request.loginMethod || user.loginMethod;

        if (request.newPassword) {
            user.password = hashSync(this.cryptoService.decryptMessage(request.newPassword), 10);
        }

        await user.save();
        return this.userToUserDTO(user);
    }

    public async deleteUser(request: UserRequest): Promise<void> {
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { username: request.username },
                    { email: request.email }
                ]
            }
        });

        if (!user) {
            throw new NotFoundException();
        }

        if (request.password && user.password) {
            const decryptedPassword = this.cryptoService.decryptMessage(request.password);
            if (!compareSync(decryptedPassword, user.password)) {
                throw new WrongPasswordException();
            }
        }

        await user.destroy();
    }

    private async generateJwtToken(user: User | UserDTO): Promise<string> {
        const secret = process.env.SECRET;
        const payload = { username: user.username };

        if (!secret) {
            throw new Error('JWT secret is not defined');
        }

        let token = jwt.sign(payload, secret, { expiresIn: '30m' });

        if (user.loginMethod === LoginMethodConstant.GOOGLE && (user as UserDTO).token) {
            token = (user as UserDTO).token ?? jwt.sign(payload, secret, { expiresIn: '30m' });
        }

        try {
            const reply = await redisClient.RPUSH(`${user.username}:${user.role}`, token);
            console.log('Token stored successfully:', reply);

            const expireReply = await redisClient.EXPIRE(`${user.username}:${user.role}`, 30 * 60);
            console.log('Expiration set successfully:', expireReply);
        } catch (err) {
            console.error('Error storing token in Redis:', err);
        }

        return token;
    }

    public async validateToken(userDTO: UserDTO): Promise<UserDTO> {
        const user = await this.findUserByUsername(userDTO.username);

        if (!user) {
            throw new NotFoundException();
        }

        const tokens = await redisClient.LRANGE(`${user.username}:${user.role}`, 0, -1);

        if (userDTO.token && tokens.includes(userDTO.token)) {
            userDTO.loginMethod = user.loginMethod;
            userDTO.role = user.role;

            if (user.loginMethod === LoginMethodConstant.GOOGLE) {
                var res = await admin.auth().verifyIdToken(userDTO.token);

                if (res.uid != user.firebaseUid) {
                    throw new ExpiredTokenException();
                }
            }

            await redisClient.LREM(`${user.username}:${user.role}`, 1, userDTO.token);
            userDTO.token = await this.generateJwtToken(userDTO);

            return userDTO;
        } else {
            throw new ExpiredTokenException();
        }
    }

    public async logoutUser(userDTO: UserDTO): Promise<number> {
        const user = await this.findUserByUsername(userDTO.username);

        if (!user) {
            throw new NotFoundException();
        }

        const tokenToRemove = userDTO.token;

        var deleteCount = 0;
        if (tokenToRemove) {
            deleteCount = await redisClient.LREM(`${user.username}:${user.role}`, 1, tokenToRemove);
        }

        return deleteCount;
    }

    public async authWithGoogle(request: UserRequest): Promise<UserDTO> {
        const user = await User.findOne({
            where: {
                email: request.email
            }
        });

        var userDTO: UserDTO = {};
        var token: string = "";

        if (!user) {
            userDTO = await this.registerUser(request);
            token = await this.generateJwtToken(userDTO);
        } else {
            userDTO = this.userToUserDTO(user);
            userDTO.token = request.token;
            token = await this.generateJwtToken(userDTO);
            user.lastLoggedOn = new Date();
            user.loginMethod = LoginMethodConstant.GOOGLE;
            await user.save();
        }

        userDTO.token = token;

        return userDTO;
    }

    public async validateGoogleUser(request: UserDTO): Promise<UserDTO> {
        const user = await User.findOne({
            where: {
                email: request.email
            }
        });

        if (!user) {
            throw new NotFoundException();
        }

        return this.userToUserDTO(user);
    }

    private async findUserByUsername(username: string | undefined): Promise<User | null> {

        if (username == undefined) {
            return null;
        }

        return await User.findOne({
            where: {
                username: username
            }
        });
    }

    private userToUserDTO(user: User): UserDTO {
        return {
            username: user.username,
            email: user.email,
            role: user.role,
            loginMethod: user.loginMethod
        };
    }
}
