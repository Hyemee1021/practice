const auth = (req, res, next) => {
  try {
    //1. get the access key from the front
    const { authorization } = req.header;
    //2. decode the jwt
    //3. extract email and identify user
    //4 check if user is active

    res.status(401).json({
      status: "error",
      message: "Unauthorized",
    });
  } catch (error) {
    next(error);
  }
};
