export const listSchema = {
    summary: '게시판 목록 조회',
    description: `- 게시판 목록을 조회합니다.`,
    tags: ['Board'],
    body: {
        type: 'object',
        required: ['pageNum', 'rowsPerPage'],
        properties: {
            pageNum : { type: 'number' },
            rowsPerPage : { type: 'number' },
        }
    },
    response: {
        200: {
            type: 'object',
            properties: {
                result: { type: 'array', items: { type: 'object', additionalProperties: true }},
                totalCount : {type : 'number'},
                totalPages : {type : 'number'}
            }
        },
        422:{
            type: 'object',
            properties: {
                error: { type: 'string' },
            }
        },
        500:{
            type: 'object',
            properties: {
                error: { type: 'string' },
            }
        }
    }
}

export const detailSchema = {
    summary : '게시판 상세 조회',
    description : '- id를 통해 해당 게시판의 상세 내용을 조회합니다.',
    tags : ['Board'],
    body : {
        type : 'object',
        required : ['id'],
        properties : {
            id : {type : 'number'}
        }
    },
    response : {
        200 : {
            type : 'object',
            properties : {
                result : {type : 'object', additionalProperties : true}
            }
        },
        422 : {
            type : 'object',
            properties : {
                error : {type : 'string'}
            }
        },
        500 : {
            type : 'object',
            properties : {
                error : {type : 'string'}
            }
        }
    }

}

export const insertSchema = {
    summary : '게시판 등록',
    description : '- 게시판을 등록합니다.',
    tags : ['Board'],
    body : {
        type : 'object',
        required : ['title', 'content', 'writer', 'password'],
        properties : {
            title : {type : 'string'},
            content : {type : 'string'},
            writer : {type : 'string'},
            password : {type : 'string'}
        }
    },
    response : {
        201 : {
            type : 'object',
            properties : {
                result : {type : 'number'}
            }
        }
    }
}

export const deleteSchema = {
    summary : '게시판 삭제',
    description : '- 게시판을 삭제합니다.',
    tags : ['Board'],
    body : {
        type : 'object',
        required : ['id', 'password'],
        properties : {
            id : {type : 'number'},
            password : {type : 'string'}
        }
    },
    response : {
        200 : {
            type : 'object',
            properties : {
                result : {type : 'number'}
            }
        },
        422 : {
            type : 'object',
            properties : {
                error : {type : 'string'}
            }
        },
        500 : {
            type : 'object',
            properties : {
                error : {type : 'string'}
            }
        }
    }

}

export const updateSchema = {
    summary : '게시판 수정',
    description : '- 게시판을 수정합니다.',
    tags : ['Board'],
    body : {
        type : 'object',
        required : ['id', 'title', 'content', 'password'],
        properties : {
            id : {type : 'number'},
            title : {type : 'string'},
            content : {type : 'string'},
            password : {type : 'string'}
        }
    },
    response : {
        200 : {
            type : 'object',
            properties : {
                result : {type : 'number'}
            }
        },
        422 : {
            type : 'object',
            properties : {
                error : {type : 'string'}
            }
        },
        500 : {
            type : 'object',
            properties : {
                error : {type : 'string'}
            }
        }
    }
}