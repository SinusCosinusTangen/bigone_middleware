import { NextFunction, Request, Response } from 'express';
import { IAuthService } from '../services/IAuthService';
import { AuthService } from '../services/AuthService';
import { ApiConstant } from '../constants/ApiConstant';
import { UserRequest, AuthDTO, UserDTO } from '../models/AuthDTO';
import { CryptoDTO } from '../models/CryptoDTO';
import { UserExistsException, WrongPasswordException, NotFoundException } from '../exceptions/exceptions';
import { ICryptoService } from '../services/ICryptoService';
import { CryptoService } from '../services/CryptoService';

class AuthController {
    private cryptoService: ICryptoService;
    private authService: IAuthService;

    constructor() {
        this.cryptoService = new CryptoService();
        this.authService = new AuthService(this.cryptoService);
    }

    public async getPublicKey(req: Request, res: Response, next: NextFunction) {
        try {
            const cryptoDTO: CryptoDTO = await this.authService.getPublicKey();
            res.status(200).json({
                status: ApiConstant.OK,
                message: ApiConstant.OK_MESSAGE,
                data: cryptoDTO
            });
        } catch (error) {
            res.status(500).json({ message: 'An error occurred while fetching the public key.' });
        }
    }

    public async encrypt(req: Request, res: Response) {
        const request = req.params.param;
        try {
            const encryptedText: string = await this.authService.getEncryptedPassword(request);
            res.status(200).json({
                status: ApiConstant.OK,
                message: ApiConstant.OK_MESSAGE,
                data: encryptedText
            });
        } catch (error) {
            res.status(500).json({ message: 'An error occurred while encrypting the data.' });
        }
    }

    public async registerUser(req: Request, res: Response) {
        const requestData: UserRequest = req.body;
        try {
            const createdUser = await this.authService.registerUser(requestData);
            res.status(201).json({
                status: ApiConstant.CREATED,
                message: ApiConstant.CREATED_MESSAGE,
                data: createdUser
            });
        } catch (error) {
            if (error instanceof UserExistsException) {
                res.status(200).json({
                    status: ApiConstant.OK,
                    message: ApiConstant.OK_MESSAGE,
                    data: "USER ALREADY EXISTS"
                });
            } else if (error instanceof Error && error.message === "PASSWORD IS EMPTY") {
                res.status(400).json({
                    status: ApiConstant.BAD_REQUEST,
                    message: ApiConstant.BAD_REQUEST_MESSAGE,
                    data: "PASSWORD IS EMPTY"
                });
            } else {
                res.status(400).json({
                    status: ApiConstant.BAD_REQUEST,
                    message: ApiConstant.BAD_REQUEST_MESSAGE,
                    data: "USERNAME OR EMAIL IS EMPTY"
                });
            }
        }
    }

    public async loginUser(req: Request, res: Response) {
        const requestData: AuthDTO = req.body;
        try {
            const user: UserDTO = await this.authService.loginUser(requestData);
            res.status(200).json({
                status: ApiConstant.OK,
                message: ApiConstant.OK_MESSAGE,
                data: user
            });
        } catch (error) {
            if (error instanceof WrongPasswordException) {
                res.status(401).json({
                    status: ApiConstant.UNAUTHORIZED,
                    message: ApiConstant.UNAUTHORIZED_MESSAGE,
                    data: "WRONG PASSWORD"
                });
            } else if (error instanceof NotFoundException) {
                res.status(404).json({
                    status: ApiConstant.NOT_FOUND,
                    message: ApiConstant.NOT_FOUND_MESSAGE,
                    data: "USER NOT FOUND"
                });
            } else {
                throw error;
            }
        }
    }

    public async updateUser(req: Request, res: Response) {
        const requestData: UserRequest = req.body;
        try {
            const updatedUser = await this.authService.updateUser(requestData);
            res.status(200).json({
                status: ApiConstant.OK,
                message: ApiConstant.OK_MESSAGE,
                data: updatedUser
            });
        } catch (error) {
            if (error instanceof WrongPasswordException) {
                res.status(401).json({
                    status: ApiConstant.UNAUTHORIZED,
                    message: ApiConstant.UNAUTHORIZED_MESSAGE,
                    data: "WRONG PASSWORD"
                });
            } else if (error instanceof NotFoundException) {
                res.status(404).json({
                    status: ApiConstant.NOT_FOUND,
                    message: ApiConstant.NOT_FOUND_MESSAGE,
                    data: "USER NOT FOUND"
                });
            } else {
                res.status(500).json({ message: 'An error occurred while updating the user.' });
            }
        }
    }

    public async deleteUser(req: Request, res: Response) {
        const requestData: UserRequest = req.body;
        try {
            await this.authService.deleteUser(requestData);
            res.status(204).send();
        } catch (error) {
            if (error instanceof WrongPasswordException) {
                res.status(401).json({
                    status: ApiConstant.UNAUTHORIZED,
                    message: ApiConstant.UNAUTHORIZED_MESSAGE,
                    data: "WRONG PASSWORD"
                });
            } else if (error instanceof NotFoundException) {
                res.status(404).json({
                    status: ApiConstant.NOT_FOUND,
                    message: ApiConstant.NOT_FOUND_MESSAGE,
                    data: "USER NOT FOUND"
                });
            } else {
                res.status(500).json({ message: 'An error occurred while deleting the user.' });
            }
        }
    }

    public async validateUser(req: Request, res: Response) {
        const requestData: UserRequest = req.body;
        try {
            const validatedUser = await this.authService.validateToken(requestData);
            if (validatedUser.token !== "EXPIRED") {
                res.status(200).json({
                    status: ApiConstant.OK,
                    message: ApiConstant.OK_MESSAGE,
                    data: validatedUser
                });
            } else {
                res.status(401).json({
                    status: ApiConstant.UNAUTHORIZED,
                    message: ApiConstant.UNAUTHORIZED_MESSAGE,
                    data: validatedUser
                });
            }
        } catch (error) {
            if (error instanceof NotFoundException) {
                res.status(404).json({
                    status: ApiConstant.NOT_FOUND,
                    message: ApiConstant.NOT_FOUND_MESSAGE,
                    data: "USER NOT FOUND"
                });
            } else {
                res.status(500).json({ message: 'An error occurred while deleting the user.' });
            }
        }
    }

    public async logoutUser(req: Request, res: Response) {
        const requestData: UserRequest = req.body;
        try {
            const logoutUser = await this.authService.logoutUser(requestData);
            if (logoutUser == 1) {
                res.status(200).json({
                    status: ApiConstant.OK,
                    message: ApiConstant.OK_MESSAGE,
                    data: "LOGOUT"
                });
            } else {
                res.status(401).json({
                    status: ApiConstant.UNAUTHORIZED,
                    message: ApiConstant.UNAUTHORIZED_MESSAGE,
                    data: "USER NOT LOGIN"
                });
            }
        } catch (error) {
            if (error instanceof NotFoundException) {
                res.status(404).json({
                    status: ApiConstant.NOT_FOUND,
                    message: ApiConstant.NOT_FOUND_MESSAGE,
                    data: "USER NOT FOUND"
                });
            } else {
                res.status(500).json({ message: 'An error occurred while logout user.' });
            }
        }
    }
}

export default new AuthController();
