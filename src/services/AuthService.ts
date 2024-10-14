import User from '../models/User';
import jwt from 'jsonwebtoken';
import { UserRequest, AuthDTO, UserDTO } from '../models/AuthDTO';
import { CryptoDTO } from '../models/CryptoDTO';
import { ICryptoService } from './ICryptoService';
import { UserExistsException, WrongPasswordException, NotFoundException } from '../exceptions/exceptions';
import { compareSync, hashSync } from 'bcryptjs';
import { IAuthService } from './IAuthService';
import { Op } from 'sequelize';
import { redisClient } from '../config/Redis';

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

        if (!request.password) {
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
            password: hashSync(this.cryptoService.decryptMessage(request.password), 10),
            role: 'guest',
            loginMethod: request.loginMethod || 'username/email',
            createdDate: new Date(),
            lastModified: new Date(),
        });

        return this.userToUserDTO(user);
    }

    public async loginUser(request: AuthDTO): Promise<UserDTO> {
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { username: request.usernameEmail },
                    { email: request.usernameEmail }
                ]
            }
        });

        if (!user) {
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
            throw new NotFoundException('User not found');
        }

        if (request.password) {
            const decryptedPassword = this.cryptoService.decryptMessage(request.password);
            if (!compareSync(decryptedPassword, user.password)) {
                throw new WrongPasswordException('Provided password is incorrect');
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
            throw new NotFoundException('User not found');
        }

        if (request.password) {
            const decryptedPassword = this.cryptoService.decryptMessage(request.password);
            if (!compareSync(decryptedPassword, user.password)) {
                throw new WrongPasswordException('Provided password is incorrect');
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

        const token = jwt.sign(payload, secret, { expiresIn: '30m' });

        await redisClient.SET(`${user.username}`, token.toString(), {
            EX: 30 * 60,
        });

        return token;
    }

    public async validateToken(userDTO: UserDTO): Promise<UserDTO> {
        const token = await redisClient.get(`token:${userDTO.username}`);

        if (userDTO.token === token) {
            userDTO.token = await this.generateJwtToken(userDTO);
            return userDTO;
        }

        userDTO.token = "EXPIRED";
        return userDTO;
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
