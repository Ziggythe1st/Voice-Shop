import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    tools: [
      {
        name: "list_products",
        description: "Search or browse products.",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string" },
            category: { type: "string" },
          },
        },
      },
      {
        name: "get_product",
        parameters: {
          type: "object",
          properties: { productId: { type: "string" } },
          required: ["productId"],
        },
      },
      { name: "create_cart", parameters: { type: "object", properties: {} } },
      {
        name: "add_to_cart",
        parameters: {
          type: "object",
          properties: {
            cartId: { type: "string" },
            productId: { type: "string" },
            quantity: { type: "integer", minimum: 1 },
          },
          required: ["cartId", "productId", "quantity"],
        },
      },
      {
        name: "checkout_cart",
        parameters: {
          type: "object",
          properties: {
            cartId: { type: "string" },
            promoCode: { type: "string" },
          },
          required: ["cartId"],
        },
      },
      {
        name: "track_order",
        parameters: {
          type: "object",
          properties: { orderId: { type: "string" } },
          required: ["orderId"],
        },
      },
      {
        name: "list_promotions",
        parameters: { type: "object", properties: {} },
      },
    ],
  });
}
