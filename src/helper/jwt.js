import jwt from "jsonwebtoken";

const createJWT = (email) => {
  return jwt.sign({ email }, process.env.J);
};
