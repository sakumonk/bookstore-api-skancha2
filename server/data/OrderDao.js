// TODO: Implement the operations of OrderDao.
//  Do not change the signature of any of the operations!
//  You may add helper functions, other variables, etc, as the need arises!
const Order = require("../model/Order");
const ApiError = require("../model/ApiError");
const ProductDao = require("./ProductDao");
const UserDao = require("./UserDao");


const products_dao = new ProductDao();
const users_dao = new UserDao();


class OrderDao {
  // When an order is created, it is in "active" state
  async create({ customer, products }) {
    // Hint: Total price is computer from the list of products.
    let status = "ACTIVE"; //status is by default ACTIVE
    let total = 0;

    if ((customer === undefined || customer === "") && (products === null || products === undefined ) ) {
      throw new ApiError(400, "missing payload");
    }

    if (customer === undefined || customer === "") { //check if has customer name
      throw new ApiError(403, "Every order must have a customer attributed to it!");
    }

    await users_dao.read(customer); //check to see if this customer exist in the database


    for (const product of products) { //find total
      if (product.quantity <= 0) { //invalid product (zero and negative)
        throw new ApiError(400, "quantity must be positive!");
      }
      try{
        let current_prod = await products_dao.read(product.product);
        total += product.quantity * current_prod.price;
      } catch (err) {
        if (err.status != 404) {
          throw new ApiError(400, "invalid product attribute!");
        } else {
          throw new ApiError(404, "non-existing product attribute");
        }
      }
    }

    const order = await Order.create({ status, total, customer, products});
    return {
      _id: order._id.toString(),
      status: order.status,
      total: order.total,
      customer: order.customer,
      products: order.products,
    };
  }

  async read(id, customer, role) {
    // Hint:
    //  If role==="ADMIN" then return the order for the given ID
    //  Otherwise, only return it if the customer is the one who placed the order!
    const order = await Order.findById(id).lean().select("-__v");

    if (order == null) { //if order doesn't exist
      throw new ApiError(404, "invalid order ID");
    }
    
    if (role === "ADMIN") {
      return order;
    } else {
      if (order.customer.toString() === customer.toString()) {
        return order;
      } else {
        throw new ApiError(403, "unauthorized access");
      }
    }
  }

  // Pre: The requester is an ADMIN or is the customer!
  //  The route handler must verify this!
  async readAll({ customer, status }) {
    // Hint:
    //  The customer and status parameters are filters.
    //  For example, one may search for all "ACTIVE" orders for the given customer.
    let orders = await Order.find({}).lean().select("-__v");

    if (customer !== undefined) {
      orders = orders.filter((order) =>
        (order.customer.toString() === customer)
      );
    }

    if (status !== undefined) {
      orders = orders.filter((order) =>
        order.status.toLowerCase() === status.toLowerCase()
      );
    }

    return orders;
  }

  async delete(id, customer) {
    // Hint: The customer must be the one who placed the order!
    const order = await Order.findById(id).lean().select("-__v");

    if (order == null) { //if order doesn't exist
      throw new ApiError(404, "invalid order ID");
    }

    if (order.customer.toString() === customer.toString()) {
      return await Order.findByIdAndDelete(id).lean().select("-__v");
    } else { //if now owner of order doing deleting
      throw new ApiError(403, "unauthorized deletion");
    }
  }

  // One can update the list of products or the status of an order
  async update(id, customer, { products, status }) {
    // Hint: The customer must be the one who placed the order!
    const order = await Order.findById(id).lean().select("-__v");

    if (order == null) { //if order doesn't exist
      throw new ApiError(404, "invalid order ID");
    }

    if (order.customer.toString() === customer.toString()) { //order owner same person as the one doing
      //the deleting
      
      if (products === undefined || products === null) { //if products is undefined

        if (status !== "COMPLETE" && status !== "ACTIVE") { //invalid status
          throw new ApiError(400, "invalid status attribute");
        }
        
        return Order.findByIdAndUpdate( //has only status to be updated
            id,
            { status },
            { new: true, runValidators: true }
          )
            .lean()
            .select("-__v");

      } else { //has products to be updated
        let total = 0;
      for (const product of products) { //find total
        if (product.quantity <= 0) { //invalid product (zero and negative)
          throw new ApiError(400, "quantity must be positive!");
        }
          let current_prod = await products_dao.read(product.product);
          total += product.quantity * current_prod.price;
      }
      if (status !== undefined) { //has both products and status to be updated
        return Order.findByIdAndUpdate(
          id,
          { products, status, total },
          { new: true, runValidators: true }
        )
          .lean()
          .select("-__v"); 
      } else {
        return Order.findByIdAndUpdate( //has only products
          id,
          { products, total },
          { new: true, runValidators: true }
        )
          .lean()
          .select("-__v"); 
      }
      } 
    } else { //if not owner of order doing deleting
      throw new ApiError(403, "unauthorized update");
    }

  }
}

module.exports = OrderDao;
