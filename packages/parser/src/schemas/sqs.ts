import { z } from 'zod';

const SqsMsgAttributeSchema = z.object({
  stringValue: z.string().optional(),
  binaryValue: z.string().optional(),
  stringListValues: z.array(z.string()).optional(),
  binaryListValues: z.array(z.string()).optional(),
  dataType: z.string(),
});

const SqsAttributeSchema = z.object({
  ApproximateReceiveCount: z.string(),
  ApproximateFirstReceiveTimestamp: z.string(),
  MessageDeduplicationId: z.string().optional(),
  MessageGroupId: z.string().optional(),
  SenderId: z.string(),
  SentTimestamp: z.string(),
  SequenceNumber: z.string().optional(),
  AWSTraceHeader: z.string().optional(),
});

const SqsRecordSchema = z.object({
  messageId: z.string(),
  receiptHandle: z.string(),
  body: z.string(),
  attributes: SqsAttributeSchema,
  messageAttributes: z.record(z.string(), SqsMsgAttributeSchema),
  md5OfBody: z.string(),
  md5OfMessageAttributes: z.string().optional().nullable(),
  eventSource: z.literal('aws:sqs'),
  eventSourceARN: z.string(),
  awsRegion: z.string(),
});

const SqsSchema = z.object({
  Records: z.array(SqsRecordSchema),
});

export {
  SqsSchema,
  SqsRecordSchema,
  SqsAttributeSchema,
  SqsMsgAttributeSchema,
};
