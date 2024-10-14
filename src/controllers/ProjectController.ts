import { Request, Response } from 'express';
import axios, { HttpStatusCode } from 'axios';

const CSharpApiBaseUrl = 'http://localhost:5190/api/Project'; // Adjust the URL and port as necessary

class ProjectController {
    public async getProjects(req: Request, res: Response) {
        try {
            const response = await axios.get(CSharpApiBaseUrl);
            res.status(response.status).json(response.data);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                res.status(error.response.status).json(error.response.data);
            } else {
                console.log(error);
                res.status(500).json({
                    message: 'Unexpected error occurred',
                    error: error,
                });
            }
        }
    }

    public async getProject(req: Request, res: Response) {
        try {
            const response = await axios.get(`${CSharpApiBaseUrl}/${req.params.id}`);
            res.status(response.status).json(response.data);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                res.status(error.response.status).json(error.response.data);
            } else {
                console.log(error);
                res.status(500).json({
                    message: 'Unexpected error occurred',
                    error: error,
                });
            }
        }
    }

    public async updateProject(req: Request, res: Response) {
        try {
            const response = await axios.put(`${CSharpApiBaseUrl}/${req.params.id}`, req.body, {
                headers: { Authorization: this.getAuthorizationHeader(req) }
            });
            res.status(response.status).json(response.data);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                res.status(error.response.status).json(error.response.data);
            } else {
                console.log(error);
                res.status(500).json({
                    message: 'Unexpected error occurred',
                    error: error,
                });
            }
        }
    }

    public async createProject(req: Request, res: Response) {
        try {
            const response = await axios.post(CSharpApiBaseUrl, req.body, {
                headers: { Authorization: this.getAuthorizationHeader(req) }
            });
            res.status(response.status).json(response.data);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                res.status(error.response.status).json(error.response.data);
            } else {
                console.log(error);
                res.status(500).json({
                    message: 'Unexpected error occurred',
                    error: error,
                });
            }
        }
    }

    public async deleteProject(req: Request, res: Response) {
        try {
            const response = await axios.delete(`${CSharpApiBaseUrl}/${req.params.id}`, {
                headers: { Authorization: this.getAuthorizationHeader(req) }
            });
            console.log(response);
            res.status(response.status).json(response.data);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                res.status(error.response.status).json(error.response.data);
            } else {
                console.log(error);
                res.status(500).json({
                    message: 'Unexpected error occurred',
                    error: error,
                });
            }
        }
    }

    private getAuthorizationHeader(req: Request): string | undefined {
        return req.headers['authorization'];
    }
}

export default new ProjectController();
