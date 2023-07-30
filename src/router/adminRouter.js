import express from "express";
import { hashPassword } from "../helper/bcrypt.js";
import { insertAdmin, updateAdmin } from "../model/admin/AdminModel.js";
import { insertCategory } from "../model/category/CategoryModel.js";
import { newAdminValidation } from "../middleware/joiValidation.js";
import { newAdminVerficationValidation } from "../middleware/joiValidation.js";
import {
  accountVerificationEmail,
  accountVerifiedNotification,
} from "../helper/nodemailer.js";
import slugify from "slugify";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

//=====aget admin detial
router.get("/", auth, (req, res, next) => {
  try {
    res.json({
      status: "success",
      message: "here is the user info",
      user: req.userInfo,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const result = await getCategories();

    if (result?._id) {
      res.json({
        status: "success",
        message: "New category has been added",
        result,
      });
    }

    res.json({
      status: "error",
      message: "Unable to add new admin, Please try agian later",
    });
  } catch (error) {
    if (error.message.includes("E11000 duplicate key error")) {
      error.statusCode = 200;
      error.message =
        " The slug for category already exist, please change the category name and try again ";
    }

    next(error);
  }
});
//using slugify
router.post("/", async (req, res, next) => {
  try {
    const { title } = req.body;
    !title && res.json({ status: "error", message: "title is required" });
    const obj = {
      title,
      slug: slugify(title, { trim: true, lower: true }),
    };

    const result = await insertCategory(obj);

    if (result?._id) {
      res.json({
        status: "success",
        message: "New category has been added",
      });
    }

    res.json({
      status: "error",
      message: "Unable to add new admin, Please try agian later",
    });
  } catch (error) {
    if (error.message.includes("E11000 duplicate key error")) {
      error.statusCode = 400;
      error.message =
        "This email is already used by another Admin, Use different email or reset your password";
    }

    next(error);
  }
});
// create new admin api
router.post("/", newAdminValidation, async (req, res, next) => {
  try {
    const { password } = req.body;
    req.body.password = hashPassword(password);

    //TODO create code and add with req.body
    req.body.verificationCode = uuidv4(); // ⇨ '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'

    const result = await insertAdmin(req.body);

    if (result?._id) {
      res.json({
        status: "success",
        message:
          "Please check your email and follow the instruction to activate your acount",
      });

      const link = ` ${process.env.WEB_DOMAIN}/admin-verification?c=${result.verificationCode}&e=${result.email}`;

      await accountVerificationEmail({
        fName: result.fName,
        email: result.email,
        link,
      });
      return;
    }

    res.json({
      status: "error",
      message: "Unable to add new admin, Please try agian later",
    });
  } catch (error) {
    if (error.message.includes("E11000 duplicate key error")) {
      error.statusCode = 400;
      error.message =
        "This email is already used by another Admin, Use different email or reset your password";
    }

    next(error);
  }
});

//verifying the new account
router.post(
  "/admin-verification",
  newAdminVerficationValidation,
  async (req, res, next) => {
    try {
      const { e, c } = req.body;

      const filter = { email: e, verificationCode: c };
      const updateObj = {
        isVerified: true,
        verificationCode: "",
      };

      const result = await updateAdmin(filter, updateObj);

      await accountVerifiedNotification(result);
      if (result?._id) {
        res.json({
          status: "success",
          message: "Your account has been verified, you may login now",
        });
        return;
      }
      res.json({
        status: "error",
        message: "Link is expired or invalid",
      });
    } catch (error) {
      next(error);
    }
  }
);
//return the acessJWT
router.post(
  "/admin-verification",
  newAdminVerficationValidation,
  async (req, res, next) => {
    try {
      const { e, c } = req.body;

      const filter = { email: e, verificationCode: c };
      const updateObj = {
        isVerified: true,
        verificationCode: "",
      };

      const result = await updateAdmin(filter, updateObj);

      await accountVerifiedNotification(result);
      if (result?._id) {
        res.json({
          status: "success",
          message: "Your account has been verified, you may login now",
        });
        return;
      }
      res.json({
        status: "error",
        message: "Link is expired or invalid",
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
