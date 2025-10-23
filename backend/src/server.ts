  import express, { Application, Request, Response } from 'express';


   const app: Application = express();
   const PORT = process.env.PORT || 3000;


   // Middleware to parse JSON bodies
   app.use(express.json());
   // Middleware to parse URL-encoded form data
   app.use(express.urlencoded({ extended: true }));


   // Basic route
   app.get('/', (req: Request, res: Response) => {
     res.send('Hello from TypeScript Express!');
   });


   // Start the server
   app.listen(PORT, () => {
     console.log(`Server is running on http://localhost:${PORT}`);
   });
