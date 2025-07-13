export const basicSchema = {
    summary: 'Basic API',
    description: 'Basic API',
    tags: ['Basic'],
    body: {
        type: 'object',
        required: ['terminalName', 'method'],
        properties: {
            terminalName : { type: 'string' },
            method: { type: 'string' },
        }
    },
    response: {
        200: {
            type: 'object',
            properties: {
                result: { type: 'string' , enum: ['success', 'fail'] },
                data: { type: 'object' },
            }
        }
    }
}