const express = require("express");
const { checkToken } = require("../util/middleware");
const OrderDao = require("../data/OrderDao");
const UserDao = require("../data/UserDao");
const ApiError = require("../model/ApiError");
const router = express.Router();

const orders = new OrderDao();
const users_DAO = new UserDao();


router.get("/api/orders", checkToken, async (req, res, next) => {
  try {
    // TODO Implement Me!
    const { customer, status } = req.query;
    try{
      if (customer !== undefined && req.user.role === "CUSTOMER" ) { //customer query defined
        const current_customer = await users_DAO.read(customer);
        if (current_customer.username !== req.user.username) {
          throw new ApiError(403, "unauthorized access");
        }
      } else if (req.user.role === "CUSTOMER" && customer === undefined ) { //customer query undefined 
        throw new ApiError(403, "unauthorized access");
      }
      const data = await orders.readAll({customer, status});
      res.json({ data });
    } catch(err) {
      if (err.status === 403) {
        throw err
      } else { //case for invalid customer
        const data = [];
        res.json({ data });
      }
    }
    } catch (err) {
    next(err);
  }
});

router.get("/api/orders/:id", checkToken, async (req, res, next) => {
  try {
    // TODO Implement Me!
    const { id } = req.params;
    const user = await users_DAO.readOne(req.user.username);
    const data = await orders.read(id, user[0]._id, req.user.role);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.post("/api/orders", checkToken, async (req, res, next) => {
  try {
    // TODO Implement Me!
    const { customer, products } = req.body;
    const data = await orders.create({customer, products});
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

router.delete("/api/orders/:id", checkToken, async (req, res, next) => {
  try {
    // TODO Implement Me!
    const{ id } = req.params;
    const user = await users_DAO.readOne(req.user.username);
    const data = await orders.delete(id, user[0]._id );
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
});

router.put("/api/orders/:id", checkToken, async (req, res, next) => {
  try {
    // TODO Implement Me!
    const { id } = req.params;
    const { products, status } = req.body;
    if ((products === null || products === undefined) && (status === "" || status === undefined )) {
      throw new ApiError(
        400,
        "empty payload!"
      );
    }
    const user = await users_DAO.readOne(req.user.username);
    const data = await orders.update(id, user[0]._id , { products, status });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
