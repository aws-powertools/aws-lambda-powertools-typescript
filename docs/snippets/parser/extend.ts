import { Context } from 'aws-lambda';
import { LambdaInterface } from '@aws-lambda-powertools/commons';
import { parser } from '@aws-lambda-powertools/parser';
import { z } from 'zod';
import { EventBridgeSchema } from '@aws-lambda-powertools/parser/schemas';

const orderItemSchema = z.object({
  id: z.number().positive(),
  quantity: z.number(),
  description: z.string(),
});

const orderSchema = z.object({
  id: z.number().positive(),
  description: z.string(),
  items: z.array(orderItemSchema),
  optionalField: z.string().optional(),
});

const orderEventSchema = EventBridgeSchema.extend({
  detail: orderSchema, // (1)!
});

type OrderEvent = z.infer<typeof orderEventSchema>;

class Lambda extends LambdaInterface {
  @parser({ schema: orderEventSchema }) // (2)!
  public async handler(event: OrderEvent, _context: Context): Promise<void> {
    for (const item of event.detail.items) {
      // process OrderItem
      console.log(item); // (3)!
    }
  }
}

const myFunction = new Lambda();
export const handler = myFunction.handler.bind(myFunction);
