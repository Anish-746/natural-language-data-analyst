/**
 * src/constants/schema.js
 * Structured database schema for dynamic retrieval.
 */

const DB_SCHEMA_JSON = {
  users: {
    description: "Customer accounts.",
    columns: [
      { name: "id", type: "integer", description: "Primary key" },
      { name: "name", type: "varchar", description: "Full name" },
      { name: "email", type: "varchar", description: "Email address, unique" },
      { name: "country", type: "varchar", description: "Country of residence" },
      { name: "created_at", type: "timestamptz", description: "Account creation date" }
    ]
  },
  products: {
    description: "Items available for sale.",
    columns: [
      { name: "id", type: "integer", description: "Primary key" },
      { name: "name", type: "varchar", description: "Product name" },
      { name: "category", type: "varchar", description: "Product category" },
      { name: "price", type: "numeric", description: "Price in USD" },
      { name: "stock_qty", type: "integer", description: "Items remaining in stock" }
    ]
  },
  orders: {
    description: "Purchases made by users.",
    columns: [
      { name: "id", type: "integer", description: "Primary key" },
      { name: "user_id", type: "integer", description: "Foreign key to users.id" },
      { name: "product_id", type: "integer", description: "Foreign key to products.id" },
      { name: "quantity", type: "integer", description: "Number of items purchased" },
      { name: "total_amount", type: "numeric", description: "Total cost of the order" },
      { name: "status", type: "varchar", description: "'pending', 'processing', 'shipped', 'delivered', 'cancelled'" },
      { name: "created_at", type: "timestamptz", description: "Order placement date" }
    ]
  },
  subscriptions: {
    description: "Recurring user subscriptions.",
    columns: [
      { name: "id", type: "integer", description: "Primary key" },
      { name: "user_id", type: "integer", description: "Foreign key to users.id" },
      { name: "plan", type: "varchar", description: "'free', 'basic', 'pro', 'enterprise'" },
      { name: "status", type: "varchar", description: "'active', 'cancelled', 'expired', 'trial'" },
      { name: "started_at", type: "timestamptz", description: "Subscription start date" },
      { name: "renewed_at", type: "timestamptz", description: "Last renewal date" }
    ]
  }
};

export default DB_SCHEMA_JSON;
