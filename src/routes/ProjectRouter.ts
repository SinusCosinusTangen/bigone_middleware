import express, { Router } from 'express';
import ProjectController from '../controllers/ProjectController';

const projectRouter: Router = express.Router();

// Routes for the project controller
projectRouter.get('/', ProjectController.getProjects.bind(ProjectController)); // Forward GET requests for all projects
projectRouter.get('/:id', ProjectController.getProject.bind(ProjectController)); // Forward GET requests for a specific project
projectRouter.put('/:id', ProjectController.updateProject.bind(ProjectController)); // Forward PUT requests to update a project
projectRouter.post('/', ProjectController.createProject.bind(ProjectController)); // Forward POST requests to create a project
projectRouter.delete('/:id', ProjectController.deleteProject.bind(ProjectController)); // Forward DELETE requests to remove a project

export default projectRouter;
