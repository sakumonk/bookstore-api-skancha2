const faker = require("faker");
const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../../server");
const UserDao = require("../../server/data/UserDao");
const ProductDao = require("../../server/data/ProductDao");
const { createToken } = require("../../server/util/token");
const OrderDao = require("../../server/data/OrderDao");



const users = new UserDao();
const products = new ProductDao();
const orders = new OrderDao();
const request = supertest(app);

const endpoint = "/api/orders";

describe(`Test ${endpoint} endpoints`, () => {
  // You may want to declare variables here
  const tokens = {};


  beforeAll(async () => {
    await mongoose.connect(global.__MONGO_URI__);

    tokens.admin = await createToken({ role: "ADMIN" });
    tokens.invalid = tokens.admin
      .split("")
      .sort(function () {
        return 0.5 - Math.random();
      })
      .join("");
    tokens.customer = await createToken({ role: "CUSTOMER" });
    tokens.expiredAdmin = await createToken({ role: "ADMIN" }, -1);

    // You may want to do more in here, e.g. initialize
    // the variables used by all the tests!
  });

describe(`Test GET ${endpoint}`, () => {
    const samples_users = [];
    const sample_products = [];
    const sample_orders = [];
    let customer1_token;

    beforeAll(async () => {

      samples_users[0] = await users.create({
        username: "customer1",
        password: "customer1",
        role: "CUSTOMER",
      });
    
      samples_users[1] = await users.create({
        username: "customer2",
        password: "customer2",
        role: "CUSTOMER",
      });
    
      samples_users[2] = await users.create({
        username: "admin",
        password: "admin",
        role: "ADMIN",
      });
    
      sample_products[0] = await products.create({
        name: "Eloquent JavaScript",
        price: 20.99,
      });
    
      sample_products[1] = await products.create({
        name: "JavaScript: The Good Parts",
        price: 13.69,
      });
    
      sample_products[2] = await products.create({
        name: "JavaScript: The Definitive Guide",
        price: 50.69,
      });
    
      sample_orders[0] = await orders.create({
        customer: samples_users[0]._id,
        products: [
          {
            product: sample_products[0]._id,
            quantity: 2,
          },
          {
            product: sample_products[1]._id,
            quantity: 1,
          },
        ],
      });
    
      sample_orders[1] = await orders.create({
        customer: samples_users[1]._id,
        products: [
          {
            product: sample_products[2]._id,
            quantity: 2,
          },
        ],
      });
    
      sample_orders[2] = await orders.create({
        customer: samples_users[2]._id,
        products: [
          {
            product: sample_products[0]._id,
            quantity: 1,
          },
        ],
      });

      await orders.update(sample_orders[2]._id, sample_orders[2].customer, { status: "COMPLETE" });

      customer1_token = await createToken(samples_users[0]); //customer1's token
    });

    test("Return 403 for missing token", async () => {
      const response = await request.get(endpoint);
      expect(response.status).toBe(403);
    });

    test("Return 403 for invalid token", async () => {
      // TODO Implement me!
      const response = await request
        .get(endpoint)
        .set("Authorization", `Bearer ${tokens.invalid}`);
      expect(response.status).toBe(403);
    });

    test("Return 403 for unauthorized token", async () => {
      // An admin can see any order, however a customer should not be allowed to
      //  see other customers' orders
      // TODO Implement me!
      const response = await request
        .get(endpoint)
        .set("Authorization", `Bearer ${tokens.customer}`);
      expect(response.status).toBe(403);
    });

    test("Return 403 for unauthorized token, when customer try to get other people's order", async () => {
      // TODO Implement me!
      const response = await request
      .get(`${endpoint}?customer=${samples_users[1]._id}`)
        .set("Authorization", `Bearer ${tokens.customer}`);
      expect(response.status).toBe(403);
    });

    test("Return 403 for expired token", async () => {
      // TODO Implement me!
      const response = await request
        .get(endpoint)
        .set("Authorization", `Bearer ${tokens.expiredAdmin}`);
      expect(response.status).toBe(403);
    });

    describe("Return 200 and list of orders for successful request", () => {
      test("Admin can see any order", async () => {
        // TODO Implement me!
        const response = await request
        .get(endpoint)
        .set("Authorization", `Bearer ${tokens.admin}`);
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(sample_orders.length);
      });

      test("Customer can see their orders", async () => {
        // TODO Implement me!;
        const response = await request
        .get(`${endpoint}?customer=${samples_users[0]._id}`)
        .set("Authorization", `Bearer ${customer1_token}`);
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].customer.toString()).toBe(samples_users[0]._id);
      });
    });

    describe(`Test GET ${endpoint} with query parameter`, () => {
      describe("Admin can see any order", () => {
        test("Return 200 and the order for a given customer", async () => {
          // TODO Implement me!  
          const response = await request
        .get(`${endpoint}?customer=${samples_users[0]._id}`)
        .set("Authorization", `Bearer ${tokens.admin}`);
        expect(response.status).toBe(200);
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].customer.toString()).toBe(samples_users[0]._id);
        });

        test("Return 200 and the orders with status of ACTIVE", async () => {
          // TODO Implement me!
          const status = "ACTIVE";
          const response = await request
        .get(`${endpoint}?status=${status}`)
        .set("Authorization", `Bearer ${tokens.admin}`);
        expect(response.status).toBe(200);
        expect(response.body.data.length).toBe(2);
        expect(response.body.data[0].status).toBe("ACTIVE");
        expect(response.body.data[1].status).toBe("ACTIVE");
        });

        test("Return 200 and the orders with status of COMPLETE", async () => {
          // TODO Implement me!
          const status = "COMPLETE";
          const response = await request
        .get(`${endpoint}?status=${status}`)
        .set("Authorization", `Bearer ${tokens.admin}`);
        expect(response.status).toBe(200);
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].status).toBe("COMPLETE");
        });
      });

      describe("Customer can see their order(s)", () => {
        test("Return 200 and the order for a given customer", async () => {
          // TODO Implement me!
          const response = await request
        .get(`${endpoint}?customer=${samples_users[0]._id}`)
        .set("Authorization", `Bearer ${customer1_token}`);
        expect(response.status).toBe(200);
        expect(response.body.data.length).toBe(1);
        });

        test("Return 200 and this customer's orders with status of ACTIVE", async () => {
          // TODO Implement me!
          const status = "ACTIVE";
          const response = await request
        .get(`${endpoint}?customer=${samples_users[0]._id}&status=${status}`)
        .set("Authorization", `Bearer ${customer1_token}`);
        expect(response.status).toBe(200);
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].customer.toString()).toBe(samples_users[0]._id);
        expect(response.body.data[0].status).toBe("ACTIVE");

        });

        test("Return 200 and this customer's orders with status of COMPLETE", async () => {
          // TODO Implement me!
          const status = "COMPLETE";
          const response = await request
        .get(`${endpoint}?customer=${samples_users[0]._id}&status=${status}`)
        .set("Authorization", `Bearer ${customer1_token}`);
        expect(response.status).toBe(200);
        expect(response.body.data.length).toBe(0);
        });
      });

      test("Return 200 and an empty list for orders with invalid customer query", async () => {
        // TODO Implement me!
        const invalidID = "OOAA"
          const response = await request
        .get(`${endpoint}?customer=${invalidID}`)
        .set("Authorization", `Bearer ${customer1_token}`);
        expect(response.status).toBe(200);
        expect(response.body.data.length).toBe(0);
      });

      test("Return 200 and an empty list for orders with invalid status query", async () => {
        // TODO Implement me!
        const status = "COM";
          const response = await request
        .get(`${endpoint}?status=${status}`)
        .set("Authorization", `Bearer ${tokens.admin}`);
        expect(response.status).toBe(200);
        expect(response.body.data.length).toBe(0);
      });
    });

    afterAll(async () => {
      await orders.delete(sample_orders[0]._id, sample_orders[0].customer);
      await orders.delete(sample_orders[1]._id, sample_orders[1].customer);
      await orders.delete(sample_orders[2]._id, sample_orders[2].customer);
      
      await products.delete(sample_products[0]._id);
      await products.delete(sample_products[1]._id);
      await products.delete(sample_products[2]._id);

      await users.delete(samples_users[0]._id);
      await users.delete(samples_users[1]._id);
      await users.delete(samples_users[2]._id);
    });

});

  describe(`Test GET ${endpoint}/:id`, () => {

    let user;
    let user2;
    let user3;
    let item;
    let usertoken;
    let usertoken2;
    let usertoken3;
    let order;
    let orderTemplate

    beforeAll(async () => {
      user = await users.create({
        username: "existing-user-post",
        password: "existing-user-post",
        role: "CUSTOMER",
      });

      user2 = await users.create({
        username: "existing-user-post2",
        password: "existing-user-post2",
        role: "ADMIN",
      });

      user3 = await users.create({
        username: "existing-user-post3",
        password: "existing-user-post3",
        role: "CUSTOMER",
      });

      item = await products.create({
        name: "Eloquent JavaScript",
        price: 20.99,
      });

      usertoken = await createToken(user);
      usertoken2 = await createToken(user2);
      usertoken3 = await createToken(user3);



      orderTemplate = {
        customer: user._id,
        products: [
          {
            product: item._id,
            quantity: 2,
          },
        ],
      }

      order = await orders.create(orderTemplate);
    });

    test("Return 404 for invalid order ID", async () => {
      // TODO Implement me!
      const id = mongoose.Types.ObjectId().toString();
      const response = await request
        .get(`${endpoint}/${id}`)
        .set("Authorization", `Bearer ${usertoken}`);
      expect(response.status).toBe(404);
    });

    test("Return 403 for missing token", async () => {
      // TODO Implement me!
      const id = order._id;
      const response = await request
        .get(`${endpoint}/${id}`)
      expect(response.status).toBe(403);
    });

    test("Return 403 for invalid token", async () => {
      // TODO Implement me!
      const id = order._id;
      const response = await request
        .get(`${endpoint}/${id}`)
        .set("Authorization", `Bearer ${tokens.invalid}`);
      expect(response.status).toBe(403);
    });

    test("Return 403 for unauthorized token", async () => {
      // An admin can see any order, however a customer should not be allowed to
      //  see other customers' orders
      // TODO Implement me!
      const id = order._id;
      const response = await request
        .get(`${endpoint}/${id}`)
        .set("Authorization", `Bearer ${tokens.customer}`);
      expect(response.status).toBe(403);
    });

    test("Return 403 for expired token", async () => {
      // TODO Implement me!
      const id = order._id;
      const response = await request
        .get(`${endpoint}/${id}`)
        .set("Authorization", `Bearer ${tokens.expiredAdmin}`);
      expect(response.status).toBe(403);
    });

    describe("Return 200 and the order for successful request", () => {
      test("Admin can see any order", async () => {
        // TODO Implement me!
        const id = order._id;
      const response = await request
        .get(`${endpoint}/${id}`)
        .set("Authorization", `Bearer ${tokens.admin}`);
      expect(response.status).toBe(200);
      expect(response.body.data.customer).toBe(user._id);
      expect(response.body.data.products[0].product).toBe(item._id);
      expect(response.body.data.products[0].quantity).toBe(2);
      expect(response.body.data.status).toBe("ACTIVE");
      expect(response.body.data.total).toBe(item.price * orderTemplate.products[0].quantity);
      });

      test("Customer can see their order only", async () => {
        // TODO Implement me!
        const id = order._id;
      const response = await request
        .get(`${endpoint}/${id}`)
        .set("Authorization", `Bearer ${usertoken}`);
      expect(response.status).toBe(200);
      expect(response.body.data.customer).toBe(user._id);
      expect(response.body.data.products[0].product).toBe(item._id);
      expect(response.body.data.products[0].quantity).toBe(2);
      expect(response.body.data.status).toBe("ACTIVE");
      expect(response.body.data.total).toBe(item.price * orderTemplate.products[0].quantity);
      });
    });

    afterAll(async () => {
      await orders.delete(order._id, order.customer);
      await products.delete(item._id);
      await users.delete(user._id);
      await users.delete(user2._id);
      await users.delete(user3._id);
    });
  });

  describe(`Test POST ${endpoint}`, () => {
    let user;
    let item;
    let usertoken;
    let order;

    beforeAll(async () => {
      user = await users.create({
        username: "existing-user-post",
        password: "existing-user-post",
        role: "ADMIN",
      });

      item = await products.create({
        name: "Eloquent JavaScript",
        price: 20.99,
      });

      usertoken = await createToken(user);

      order = {
        customer: user._id,
        products: [
          {
            product: item._id,
            quantity: 2,
          },
        ],
      }
      
    });


    test("Return 403 for missing token", async () => {
      // TODO Implement me!
      const response = await request.post(endpoint).send(order);
      expect(response.status).toBe(403);
    });

    test("Return 403 for invalid token", async () => {
      // TODO Implement me!
      const response = await request
        .post(endpoint)
        .send(order)
        .set("Authorization", `Bearer ${tokens.invalid}`);
      expect(response.status).toBe(403);
    });

    test("Return 403 for expired token", async () => {
      // TODO Implement me!
      const response = await request
        .post(endpoint)
        .send(order)
        .set("Authorization", `Bearer ${tokens.expiredAdmin}`);
      expect(response.status).toBe(403);
    });

    test("Return 400 for missing customer", async () => {
      // TODO Implement me!
      let order_nocustomer = {
        products: [
          {
            product: item._id,
            quantity: 2,
          },
        ],
      }
      const response = await request
        .post(endpoint)
        .send(order_nocustomer)
        .set("Authorization", `Bearer ${tokens.admin}`);
      expect(response.status).toBe(403);
    });

    test("Return 404 for non-existing customer", async () => {
      // A token with a user ID that resembles a valid mongoose ID
      //  however, there is no user in the database with that ID!
      let new_user = await users.create({
        username: "new-user-post",
        password: "new-user-post",
        role: "ADMIN",
      });
      await users.delete(new_user._id); //user deleted
      let ghost_order = {
        customer: new_user._id,
        products: [
          {
            product: item._id,
            quantity: 2,
          },
        ],
      }

      const response = await request
        .post(endpoint)
        .send(ghost_order)
        .set("Authorization", `Bearer ${tokens.admin}`);
      expect(response.status).toBe(404);
      // TODO Implement me!
    });

    test("Return 400 for missing payload", async () => {
      // TODO Implement me!
      let empty_order = {};
      const response = await request
        .post(endpoint)
        .send(empty_order)
        .set("Authorization", `Bearer ${tokens.admin}`);
      expect(response.status).toBe(400);
    });

    test("Return 400 for invalid quantity attribute", async () => {
      // Quantity attribute for each product must be a positive value.
      let order_neg_quant = {
        customer: user._id,
        products: [
          {
            product: item._id,
            quantity: -1,
          },
        ],
      }
      const response = await request
        .post(endpoint)
        .send(order_neg_quant)
        .set("Authorization", `Bearer ${tokens.admin}`);
      expect(response.status).toBe(400);
      // TODO Implement me!
    });

    test("Return 404 for non-existing product attribute", async () => {
      // A product ID that resembles a valid mongoose ID
      //  however, there is no product in the database with that ID!
      // TODO Implement me!
      let order_inv_prod = {
        customer: user._id,
        products: [
          {
            product: mongoose.Types.ObjectId().toString(),
            quantity: 1,
          },
        ],
      }

      const response = await request
        .post(endpoint)
        .send(order_inv_prod)
        .set("Authorization", `Bearer ${tokens.admin}`);
      expect(response.status).toBe(404);
    });

    test("Return 400 for invalid product attribute", async () => {
      // A product ID that is not even a valid mongoose ID!
      let nonsense_id = "oo-oo-aa-aa";

      let order_nonsense = {
        customer: user._id,
        products: [
          {
            product: nonsense_id,
            quantity: 1,
          },
        ],
      };

      const response = await request
        .post(endpoint)
        .send(order_nonsense)
        .set("Authorization", `Bearer ${tokens.admin}`);
      expect(response.status).toBe(400);
      // TODO Implement me!
    });

    test("Return 201 and the order for successful request", async () => {
      // The "customer" who places the order must be identified through
      //  the authorization token.
      // Moreover, when an order is placed, its status is ACTIVE.
      // The client only provides the list of products.
      // The API shall calculate the total price!
      // TODO Implement me!

      const response = await request
        .post(endpoint)
        .send(order)
        .set("Authorization", `Bearer ${usertoken}`);
      expect(response.status).toBe(201);
      expect(response.body.data.customer).toBe(user._id);
      expect(response.body.data.products[0].product).toBe(item._id);
      expect(response.body.data.products[0].quantity).toBe(2);
      expect(response.body.data.status).toBe("ACTIVE");
      expect(response.body.data.total).toBe(item.price * order.products[0].quantity);
      order._id = response.body.data._id;
    });

    afterAll(async () => {
      await orders.delete(order._id, order.customer);
      await users.delete(user._id);
      await products.delete(item._id);
    });
  });

  describe(`Test PUT ${endpoint}/:id`, () => {
    let user;
    let user2;
    let item;
    let usertoken;
    let usertoken2;
    let order;

    beforeAll(async () => {
      user = await users.create({
        username: "existing-user-post",
        password: "existing-user-post",
        role: "ADMIN",
      });

      user2 = await users.create({
        username: "existing-user-post2",
        password: "existing-user-post2",
        role: "CUSTOMER",
      });

      item = await products.create({
        name: "Eloquent JavaScript",
        price: 20.99,
      });

      usertoken = await createToken(user);
      usertoken2 = await createToken(user2);


      order = {
        customer: user._id,
        products: [
          {
            product: item._id,
            quantity: 2,
          },
        ],
      }

      order = await orders.create(order);
    });

    test("Return 404 for invalid order ID", async () => {
      // TODO Implement me!
      const response = await request
        .put(`${endpoint}/${mongoose.Types.ObjectId().toString()}`)
        .send({
          status: "COMPLETE",
        })
        .set("Authorization", `Bearer ${usertoken}`);
      expect(response.status).toBe(404);
    });

    test("Return 403 for missing token", async () => {
      // TODO Implement me!
      const response = await request
        .put(`${endpoint}/${order._id}`)
        .send({
          status: "COMPLETE",
        })
      expect(response.status).toBe(403);
    });

    test("Return 403 for invalid token", async () => {
      // TODO Implement me!
      const response = await request
        .put(`${endpoint}/${order._id}`)
        .send({
          status: "COMPLETE",
        })
        .set("Authorization", `Bearer ${tokens.invalid}`);
      expect(response.status).toBe(403);
    });

    describe("Return 403 for unauthorized token", () => {
      test("Admins not allowed to update others' orders", async () => {
        // TODO Implement me!
        const response = await request
        .put(`${endpoint}/${order._id}`)
        .send({
          status: "COMPLETE",
        })
        .set("Authorization", `Bearer ${tokens.admin}`);
      expect(response.status).toBe(403);
      });

      test("Customers not allowed to update others' orders", async () => {
        // TODO Implement me!
        const response = await request
        .put(`${endpoint}/${order._id}`)
        .send({
          status: "COMPLETE",
        })
        .set("Authorization", `Bearer ${tokens.customer}`);
      expect(response.status).toBe(403);
      });
    });

    test("Return 403 for expired token", async () => {
      // TODO Implement me!
      const response = await request
        .put(`${endpoint}/${order._id}`)
        .send({
          status: "COMPLETE",
        })
        .set("Authorization", `Bearer ${tokens.expiredAdmin}`);
      expect(response.status).toBe(403);
      });

    test("Return 400 for missing payload", async () => {
      // TODO Implement me!
      const response = await request
        .put(`${endpoint}/${order._id}`)
        .send({})
        .set("Authorization", `Bearer ${usertoken}`);
      expect(response.status).toBe(400);
    });

    test("Return 400 for invalid status attribute", async () => {
      // TODO Implement me!
      const response = await request
        .put(`${endpoint}/${order._id}`)
        .send({status: "BABY"})
        .set("Authorization", `Bearer ${usertoken}`);
      expect(response.status).toBe(400);
    });

    test("Return 400 for invalid quantity attribute", async () => {
      // TODO Implement me!
      const response = await request
        .put(`${endpoint}/${order._id}`)
        .send({
          status: "COMPLETE",
          products: [
            {
              product: item._id,
              quantity: -1,
            },
          ],
      })
        .set("Authorization", `Bearer ${usertoken}`);
      expect(response.status).toBe(400);
    });

    describe("Return 200 and the updated order for successful request", () => {
      test("Update products, e.g., add/remove or change quantity", async () => {
        // TODO Implement me!
        const response = await request
        .put(`${endpoint}/${order._id}`)
        .send({
          products: [
            {
              product: item._id,
              quantity: 3,
            },
          ],
      })
        .set("Authorization", `Bearer ${usertoken}`);
        expect(response.status).toBe(200);
        expect(response.body.data.customer).toBe(user._id);
        expect(response.body.data.products[0].product).toBe(item._id);
        expect(response.body.data.products[0].quantity).toBe(3);
        expect(response.body.data.status).toBe("ACTIVE");
        expect(response.body.data.total).toBe(item.price * 3);
      });
      
        test("Update products and status", async () => {
          // TODO Implement me!
          const response = await request
          .put(`${endpoint}/${order._id}`)
          .send({
            status: "COMPLETE",
            products: [
              {
                product: item._id,
                quantity: 3,
              },
            ],
        })
          .set("Authorization", `Bearer ${usertoken}`);
          expect(response.status).toBe(200);
          expect(response.body.data.customer).toBe(user._id);
          expect(response.body.data.products[0].product).toBe(item._id);
          expect(response.body.data.products[0].quantity).toBe(3);
          expect(response.body.data.status).toBe("COMPLETE");
          expect(response.body.data.total).toBe(item.price * 3);
        });

      test("Update status, e.g., from ACTIVE to COMPLETE", async () => {
        // TODO Implement me!
        const response = await request
        .put(`${endpoint}/${order._id}`)
        .send({
          status: "COMPLETE",
        })
        .set("Authorization", `Bearer ${usertoken}`);
        expect(response.status).toBe(200);
        expect(response.body.data.customer).toBe(user._id);
        expect(response.body.data.products[0].product).toBe(item._id);
        expect(response.body.data.status).toBe("COMPLETE");
      });
    });
    
    afterAll(async () => {
      await orders.delete(order._id, order.customer);
      await products.delete(item._id);
      await users.delete(user._id);
      await users.delete(user2._id);
    });
  });

  describe(`Test DELETE ${endpoint}/:id`, () => {
    let user;
    let user2;
    let item;
    let usertoken;
    let usertoken2;
    let order;

    beforeAll(async () => {
      user = await users.create({
        username: "existing-user-post",
        password: "existing-user-post",
        role: "ADMIN",
      });

      user2 = await users.create({
        username: "existing-user-post2",
        password: "existing-user-post2",
        role: "ADMIN",
      });

      item = await products.create({
        name: "Eloquent JavaScript",
        price: 20.99,
      });

      usertoken = await createToken(user);
      usertoken2 = await createToken(user2);


      order = {
        customer: user._id,
        products: [
          {
            product: item._id,
            quantity: 2,
          },
        ],
      }

      order = await orders.create(order);
    });
    test("Return 404 for invalid order ID", async () => {
      // TODO Implement me!
      const response = await request
        .delete(`${endpoint}/${mongoose.Types.ObjectId().toString()}`)
        .set("Authorization", `Bearer ${usertoken}`);
      expect(response.status).toBe(404);
    });

    test("Return 403 for missing token", async () => {
      // TODO Implement me!
      const response = await request
        .delete(`${endpoint}/${order._id}`)
      expect(response.status).toBe(403);
    });

    test("Return 403 for invalid token", async () => {
      // TODO Implement me!
      const response = await request
        .delete(`${endpoint}/${order._id}`)
        .set("Authorization", `Bearer ${tokens.invalid}`);
      expect(response.status).toBe(403);
    });

    describe("Return 403 for unauthorized token", () => {
      test("Admins not allowed to delete others' orders", async () => {
        // TODO Implement me!
        const response = await request
        .delete(`${endpoint}/${order._id}`)
        .set("Authorization", `Bearer ${tokens.admin}`);
      expect(response.status).toBe(403);
      });

      test("Customers not allowed to delete others' orders", async () => {
        // TODO Implement me!
        const response = await request
        .delete(`${endpoint}/${order._id}`)
        .set("Authorization", `Bearer ${usertoken2}`);
      expect(response.status).toBe(403);
      });
    });

    test("Return 403 for expired token", async () => {
      // TODO Implement me!
      const response = await request
        .delete(`${endpoint}/${order._id}`)
        .set("Authorization", `Bearer ${tokens.expiredAdmin}`);
      expect(response.status).toBe(403);
    });

    test("Return 200 and the deleted order for successful request", async () => {
      // A customer may delete their order!
      // TODO Implement me!
      const response = await request
        .delete(`${endpoint}/${order._id}`)
        .set("Authorization", `Bearer ${usertoken}`);
      expect(response.status).toBe(200);
      expect(response.body.data.customer).toBe(user._id);
      expect(response.body.data.products[0].product).toBe(item._id);
      expect(response.body.data.products[0].quantity).toBe(2);
      expect(response.body.data.status).toBe("ACTIVE");
      expect(response.body.data.total).toBe(item.price * order.products[0].quantity);
    });
  });

  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  });
});
