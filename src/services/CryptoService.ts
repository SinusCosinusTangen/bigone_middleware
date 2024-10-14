import path from "path";
import fs from 'fs';
import { ICryptoService } from "./ICryptoService";
import { promises as fspromises } from "fs";
import { generateKeyPairSync, createHash, constants, publicEncrypt, privateDecrypt } from "crypto";
import { CryptoDTO } from "../models/CryptoDTO";

export class CryptoService implements ICryptoService {
    async getPublicKey(): Promise<CryptoDTO> {
        const publicKeyPath = this.getKeyPath("public");
        const privateKeyPath = this.getKeyPath("private");

        if (fs.existsSync(publicKeyPath) && fs.existsSync(privateKeyPath)) {
            const publicKey = fs.readFileSync(publicKeyPath).toString();
            return { publicKey };
        }

        const publicKey = await this.generateKey(publicKeyPath, privateKeyPath);
        return { publicKey };
    }

    async generateKey(publicKeyPath: string, privateKeyPath: string): Promise<string> {
        if (fs.existsSync(publicKeyPath) && fs.existsSync(privateKeyPath)) {
            console.log("Key already exists");
            return fs.readFileSync(publicKeyPath, 'utf-8');
        }

        if (fs.existsSync(publicKeyPath)) {
            fs.rm(publicKeyPath, (error) => {
                if (error) {
                    console.error(`Error removing file: ${error.message}`);
                } else {
                    console.log(`File at ${publicKeyPath} has been removed.`);
                }
            });
        } else if (fs.existsSync(privateKeyPath)) {
            fs.rm(privateKeyPath, (error) => {
                if (error) {
                    console.error(`Error removing file: ${error.message}`);
                } else {
                    console.log(`File at ${privateKeyPath} has been removed.`);
                }
            });
        }

        const { publicKey, privateKey } = generateKeyPairSync('rsa', {
            modulusLength: 2048,
        });

        await fspromises.writeFile(publicKeyPath, publicKey.export({ type: 'spki', format: 'pem' }));
        await fspromises.writeFile(privateKeyPath, privateKey.export({ type: 'pkcs8', format: 'pem' }));

        return publicKey.export({ type: 'spki', format: 'pem' }).toString('utf-8');
    }

    hashSha256(text: string): string {
        const bytes = Buffer.from(text, 'utf16le');
        const hash = createHash('sha256');
        hash.update(bytes);
        const hashBuffer = hash.digest();
        return hashBuffer.toString('hex');
    }

    encryptMessage(publicKey: string, message: string): string {
        const publicKeyBuffer = Buffer.from(publicKey, 'utf-8');
        const messageBuffer = Buffer.from(message, 'utf-8');

        const encryptedBytes = publicEncrypt(
            {
                key: publicKeyBuffer,
                padding: constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256',
            },
            messageBuffer
        );

        return encryptedBytes.toString('base64');
    }

    decryptMessage(encryptedMessage: string): string {
        const privateKeyPath = this.getKeyPath('private');

        if (!fs.existsSync(privateKeyPath)) {
            throw new Error('Private key file not found');
        }

        const privateKey = fs.readFileSync(privateKeyPath, 'utf-8');
        const encryptedBytes = Buffer.from(encryptedMessage, 'base64');

        const decryptedBytes = privateDecrypt(
            {
                key: privateKey,
                padding: constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256',
            },
            encryptedBytes
        );

        return decryptedBytes.toString('utf-8');
    }

    getKeyPath(keyType: string): string {
        const projectDir = process.env.NODE_ENV === "development"
            ? path.resolve(__dirname, '../../keys')
            : "/app/keys";

        return keyType === "private" ? `${projectDir}/private.pem` : `${projectDir}/public.pem`;
    }
}
