import swaggerJSDoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.3',

    info: {
      title: 'Peer Mentorship Platform API',
      version: '1.0.0',
      description:
        'Authentication, mentor-management, and appointment-booking APIs for the Peer Mentorship Platform.',
    },

    servers: [
      {
        url: '/api/v1',
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },

      schemas: {
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password', 'role'],
          properties: {
            name: {
              type: 'string',
              example: 'Aarav Sharma',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'aarav@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              minLength: 8,
              example: 'securePass123',
            },
            role: {
              type: 'string',
              enum: ['mentor', 'mentee'],
              example: 'mentor',
            },
          },
        },

        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'aarav@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'securePass123',
            },
          },
        },

        AuthResponse: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  example: '68c123456789abcdef123456',
                },
                name: {
                  type: 'string',
                  example: 'Aarav Sharma',
                },
                email: {
                  type: 'string',
                  example: 'aarav@example.com',
                },
                role: {
                  type: 'string',
                  enum: ['mentor', 'mentee'],
                  example: 'mentor',
                },
              },
            },
            accessToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIs...',
            },
          },
        },

        MentorProfileRequest: {
          type: 'object',
          required: ['bio', 'skills', 'expertise', 'experienceYears'],
          properties: {
            bio: {
              type: 'string',
              example: 'Backend developer and Java mentor.',
            },
            skills: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['Java', 'Node.js', 'MongoDB'],
            },
            expertise: {
              type: 'string',
              example: 'Backend Development',
            },
            experienceYears: {
              type: 'integer',
              minimum: 0,
              example: 3,
            },
          },
        },

        AvailabilityRequest: {
          type: 'object',
          required: ['availability'],
          properties: {
            availability: {
              type: 'array',
              items: {
                type: 'object',
                required: [
                  'dayOfWeek',
                  'startTime',
                  'endTime',
                  'isActive',
                ],
                properties: {
                  dayOfWeek: {
                    type: 'string',
                    enum: [
                      'monday',
                      'tuesday',
                      'wednesday',
                      'thursday',
                      'friday',
                      'saturday',
                      'sunday',
                    ],
                    example: 'monday',
                  },
                  startTime: {
                    type: 'string',
                    example: '10:00',
                  },
                  endTime: {
                    type: 'string',
                    example: '12:00',
                  },
                  isActive: {
                    type: 'boolean',
                    example: true,
                  },
                },
              },
            },
          },
        },

        AppointmentRequest: {
          type: 'object',
          required: ['mentorId', 'startTime', 'endTime'],
          properties: {
            mentorId: {
              type: 'string',
              example: '68c123456789abcdef123456',
            },
            startTime: {
              type: 'string',
              format: 'date-time',
              example: '2026-09-25T10:00:00.000Z',
            },
            endTime: {
              type: 'string',
              format: 'date-time',
              example: '2026-09-25T11:00:00.000Z',
            },
            notes: {
              type: 'string',
              maxLength: 1000,
              example: 'I would like to discuss backend development.',
            },
          },
        },

        Appointment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '68c987654321abcdef123456',
            },
            mentee: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                },
                name: {
                  type: 'string',
                },
                email: {
                  type: 'string',
                },
              },
            },
            mentor: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                },
                name: {
                  type: 'string',
                },
                email: {
                  type: 'string',
                },
              },
            },
            startTime: {
              type: 'string',
              format: 'date-time',
            },
            endTime: {
              type: 'string',
              format: 'date-time',
            },
            status: {
              type: 'string',
              enum: [
                'PENDING',
                'CONFIRMED',
                'COMPLETED',
                'CANCELLED',
              ],
            },
            notes: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },

        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
            },
          },
        },
      },
    },

    paths: {
      '/auth/register': {
        post: {
          summary: 'Create a mentor or mentee account',

          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/RegisterRequest',
                },
              },
            },
          },

          responses: {
            '201': {
              description: 'Account created',
            },
            '400': {
              description: 'Invalid input',
            },
            '409': {
              description: 'Email already exists',
            },
          },
        },
      },

      '/auth/login': {
        post: {
          summary: 'Sign in and receive a JWT',

          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LoginRequest',
                },
              },
            },
          },

          responses: {
            '200': {
              description: 'Signed in successfully',
            },
            '401': {
              description: 'Invalid credentials',
            },
          },
        },
      },

      '/auth/me': {
        get: {
          summary: 'Get the signed-in user',
          security: [{ bearerAuth: [] }],

          responses: {
            '200': {
              description: 'Current user',
            },
            '401': {
              description: 'Unauthenticated',
            },
          },
        },
      },

      '/auth/mentor-area': {
        get: {
          summary: 'Example mentor-only endpoint',
          security: [{ bearerAuth: [] }],

          responses: {
            '200': {
              description: 'Allowed',
            },
            '403': {
              description: 'Mentor role required',
            },
          },
        },
      },

      '/mentors': {
        get: {
          summary: 'Search and filter mentor profiles',

          parameters: [
            {
              name: 'skill',
              in: 'query',
              schema: {
                type: 'string',
              },
              example: 'node.js',
            },
            {
              name: 'expertise',
              in: 'query',
              schema: {
                type: 'string',
              },
              example: 'backend development',
            },
            {
              name: 'minExperience',
              in: 'query',
              schema: {
                type: 'integer',
              },
              example: 2,
            },
            {
              name: 'q',
              in: 'query',
              schema: {
                type: 'string',
              },
              example: 'API',
            },
          ],

          responses: {
            '200': {
              description: 'Mentor search results',
            },
          },
        },
      },

      '/mentors/profile': {
        post: {
          summary: 'Create the signed-in mentor profile',
          security: [{ bearerAuth: [] }],

          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/MentorProfileRequest',
                },
              },
            },
          },

          responses: {
            '201': {
              description: 'Profile created',
            },
            '403': {
              description: 'Mentor role required',
            },
            '409': {
              description: 'Profile already exists',
            },
          },
        },
      },

      '/mentors/profile/me': {
        get: {
          summary: 'View the signed-in mentor profile',
          security: [{ bearerAuth: [] }],

          responses: {
            '200': {
              description: 'Current mentor profile',
            },
          },
        },

        patch: {
          summary: 'Update the signed-in mentor profile',
          security: [{ bearerAuth: [] }],

          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/MentorProfileRequest',
                },
              },
            },
          },

          responses: {
            '200': {
              description: 'Profile updated',
            },
          },
        },
      },

      '/mentors/availability': {
        put: {
          summary: 'Replace the signed-in mentor availability',
          security: [{ bearerAuth: [] }],

          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AvailabilityRequest',
                },
              },
            },
          },

          responses: {
            '200': {
              description: 'Availability updated',
            },
          },
        },
      },

      '/mentors/{mentorId}': {
        get: {
          summary: 'View a public mentor profile',

          parameters: [
            {
              name: 'mentorId',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
            },
          ],

          responses: {
            '200': {
              description: 'Mentor profile',
            },
            '404': {
              description: 'Profile not found',
            },
          },
        },
      },

      '/mentors/{mentorId}/availability': {
        get: {
          summary: 'View a mentor active availability',

          parameters: [
            {
              name: 'mentorId',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
            },
          ],

          responses: {
            '200': {
              description: 'Active availability',
            },
          },
        },
      },

      // ============================
      // APPOINTMENTS
      // ============================

      '/appointments': {
        post: {
          summary: 'Book an appointment with a mentor',
          security: [{ bearerAuth: [] }],

          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AppointmentRequest',
                },
              },
            },
          },

          responses: {
            '201': {
              description: 'Appointment created',
            },
            '400': {
              description: 'Invalid appointment data',
            },
            '401': {
              description: 'Unauthenticated',
            },
            '404': {
              description: 'Mentor not found',
            },
            '409': {
              description:
                'Requested time is unavailable or conflicts with another appointment',
            },
          },
        },

        get: {
          summary: 'Get my appointments',
          security: [{ bearerAuth: [] }],

          responses: {
            '200': {
              description: 'List of appointments',
            },
            '401': {
              description: 'Unauthenticated',
            },
          },
        },
      },

      '/appointments/upcoming': {
        get: {
          summary: 'Get upcoming appointments',
          security: [{ bearerAuth: [] }],

          responses: {
            '200': {
              description: 'Upcoming appointments',
            },
            '401': {
              description: 'Unauthenticated',
            },
          },
        },
      },

      '/appointments/past': {
        get: {
          summary: 'Get past appointments',
          security: [{ bearerAuth: [] }],

          responses: {
            '200': {
              description: 'Past appointments',
            },
            '401': {
              description: 'Unauthenticated',
            },
          },
        },
      },

      '/appointments/{id}': {
        get: {
          summary: 'Get a specific appointment',
          security: [{ bearerAuth: [] }],

          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
            },
          ],

          responses: {
            '200': {
              description: 'Appointment details',
            },
            '401': {
              description: 'Unauthenticated',
            },
            '403': {
              description: 'Not an appointment participant',
            },
            '404': {
              description: 'Appointment not found',
            },
          },
        },
      },

      '/appointments/{id}/confirm': {
        patch: {
          summary: 'Confirm an appointment',
          security: [{ bearerAuth: [] }],

          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
            },
          ],

          responses: {
            '200': {
              description: 'Appointment confirmed',
            },
            '401': {
              description: 'Unauthenticated',
            },
            '403': {
              description: 'Only the mentor can confirm',
            },
            '404': {
              description: 'Appointment not found',
            },
            '409': {
              description: 'Invalid appointment status',
            },
          },
        },
      },

      '/appointments/{id}/cancel': {
        patch: {
          summary: 'Cancel an appointment',
          security: [{ bearerAuth: [] }],

          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
            },
          ],

          responses: {
            '200': {
              description: 'Appointment cancelled',
            },
            '401': {
              description: 'Unauthenticated',
            },
            '403': {
              description: 'Not an appointment participant',
            },
            '404': {
              description: 'Appointment not found',
            },
            '409': {
              description: 'Invalid appointment status',
            },
          },
        },
      },

      '/appointments/{id}/complete': {
        patch: {
          summary: 'Complete an appointment',
          security: [{ bearerAuth: [] }],

          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
            },
          ],

          responses: {
            '200': {
              description: 'Appointment completed',
            },
            '401': {
              description: 'Unauthenticated',
            },
            '403': {
              description: 'Only the mentor can complete',
            },
            '404': {
              description: 'Appointment not found',
            },
            '409': {
              description: 'Appointment cannot be completed yet',
            },
          },
        },
      },
    },
  },

  apis: [],
});
const phaseTwoPaths: Record<string, unknown> = {
  '/chat/conversations': {
    get: { tags: ['Chat'], summary: 'List the authenticated user conversations', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Conversations' }, '401': { description: 'Unauthenticated' } } },
    post: { tags: ['Chat'], summary: 'Create or retrieve a mentor-mentee conversation', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { mentorId: { type: 'string' }, menteeId: { type: 'string' }, appointmentId: { type: 'string' } } } } } }, responses: { '200': { description: 'Conversation' }, '400': { description: 'Invalid request' }, '403': { description: 'Unauthorized participant' } } },
  },
  '/chat/conversations/{conversationId}/messages': {
    get: { tags: ['Chat'], summary: 'Retrieve paginated conversation messages', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'conversationId', required: true, schema: { type: 'string' } }, { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1 } }, { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 100 } }], responses: { '200': { description: 'Messages' }, '403': { description: 'Not a participant' } } },
    post: { tags: ['Chat'], summary: 'Send a conversation message', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'conversationId', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['content'], properties: { content: { type: 'string', maxLength: 4000 } } } } } }, responses: { '201': { description: 'Message sent' }, '403': { description: 'Not a participant' } } },
  },
  '/feedback': { post: { tags: ['Feedback'], summary: 'Review a completed appointment', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['appointmentId', 'rating'], properties: { appointmentId: { type: 'string' }, rating: { type: 'integer', minimum: 1, maximum: 5 }, comment: { type: 'string', maxLength: 1000 } } } } } }, responses: { '201': { description: 'Feedback created' }, '409': { description: 'Session not completed or already reviewed' } } } },
  '/feedback/mine': { get: { tags: ['Feedback'], summary: 'List feedback submitted or received by the authenticated user', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Feedback list' } } } },
  '/feedback/mentors/{mentorId}/ratings': { get: { tags: ['Feedback'], summary: 'Get mentor average rating', parameters: [{ in: 'path', name: 'mentorId', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Average rating and total ratings' } } } },
  '/notifications': { get: { tags: ['Notifications'], summary: 'List authenticated user notifications', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Notifications' } } } },
  '/notifications/{id}/read': { patch: { tags: ['Notifications'], summary: 'Mark a notification as read', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Notification updated' }, '404': { description: 'Notification not found' } } } },
  '/dashboard': { get: { tags: ['Dashboard'], summary: 'Get mentor or mentee dashboard based on authenticated role', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Dashboard metrics' } } } },
};
Object.assign((swaggerSpec as any).paths, phaseTwoPaths);
