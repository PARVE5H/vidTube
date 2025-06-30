import { Router } from 'express';
import {
    createPost,
    deletePost,
    getUserPosts,
    updatePost,
} from "../controllers/post.controllers.js"
import {verifyJWT} from "../middlewares/auth.middlewares.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(createPost);
router.route("/user/:userId").get(getUserPosts);
router.route("/:postId").patch(updatePost).delete(deletePost);

export default router