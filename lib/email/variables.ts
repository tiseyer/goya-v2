export const TEMPLATE_VARIABLES: Record<string, Array<{ key: string; label: string; example: string }>> = {
  welcome: [
    { key: 'firstName',  label: 'First Name',    example: 'Sarah'                          },
    { key: 'mrn',        label: 'Member Number', example: '12345678'                        },
    { key: 'loginUrl',   label: 'Login URL',     example: 'https://goya.community/login'   },
  ],
  onboarding_complete: [
    { key: 'firstName',     label: 'First Name',    example: 'Sarah'                              },
    { key: 'memberType',    label: 'Member Type',   example: 'Certified Teacher'                  },
    { key: 'dashboardUrl',  label: 'Dashboard URL', example: 'https://goya.community/dashboard'   },
  ],
  verification_approved: [
    { key: 'firstName',    label: 'First Name',   example: 'Sarah'                                     },
    { key: 'designation',  label: 'Designation',  example: 'GOYA CYT200'                              },
    { key: 'profileUrl',   label: 'Profile URL',  example: 'https://goya.community/members/123'        },
  ],
  verification_rejected: [
    { key: 'firstName',    label: 'First Name',        example: 'Sarah'                                                  },
    { key: 'reason',       label: 'Rejection Reason',  example: 'Certificate could not be verified'                     },
    { key: 'contactUrl',   label: 'Contact URL',       example: 'mailto:member@globalonlineyogaassociation.org'          },
  ],
  credits_expiring: [
    { key: 'firstName',    label: 'First Name',          example: 'Sarah'               },
    { key: 'amount',       label: 'Credit Amount',       example: '25'                  },
    { key: 'creditType',   label: 'Credit Type',         example: 'CE Credits'          },
    { key: 'expiryDate',   label: 'Expiry Date',         example: 'April 19, 2026'      },
    { key: 'submitUrl',    label: 'Submit Credits URL',  example: 'https://goya.community/credits' },
  ],
  new_message: [
    { key: 'firstName',       label: 'First Name',      example: 'Sarah'                                            },
    { key: 'senderName',      label: 'Sender Name',     example: 'Michael Torres'                                   },
    { key: 'messagePreview',  label: 'Message Preview', example: 'Hi Sarah, I wanted to reach out about...'        },
    { key: 'messagesUrl',     label: 'Messages URL',    example: 'https://goya.community/messages'                  },
  ],
  school_approved: [
    { key: 'firstName',   label: 'First Name',   example: 'Sarah'                                             },
    { key: 'schoolName',  label: 'School Name',  example: 'Zen Yoga Studio'                                   },
    { key: 'schoolUrl',   label: 'School URL',   example: 'https://goya.community/schools/zen-yoga-studio'    },
  ],
  school_rejected: [
    { key: 'firstName',   label: 'First Name',        example: 'Sarah'                              },
    { key: 'schoolName',  label: 'School Name',       example: 'Zen Yoga Studio'                   },
    { key: 'reason',      label: 'Rejection Reason',  example: 'Incomplete information provided'   },
  ],
  admin_digest: [
    { key: 'count',                 label: 'Total Pending',            example: '12'  },
    { key: 'pendingVerifications',  label: 'Pending Verifications',    example: '4'   },
    { key: 'pendingCredits',        label: 'Pending Credits',          example: '6'   },
    { key: 'pendingSchools',        label: 'Pending Schools',          example: '1'   },
    { key: 'pendingContacts',       label: 'Pending Contacts',         example: '1'   },
    { key: 'inboxUrl',              label: 'Inbox URL',                example: 'https://goya.community/admin/inbox' },
  ],
  password_reset: [
    { key: 'firstName',      label: 'First Name',  example: 'Sarah'                                                },
    { key: 'resetUrl',       label: 'Reset URL',   example: 'https://goya.community/reset-password?token=...'     },
    { key: 'expiryMinutes',  label: 'Link Expiry', example: '60'                                                   },
  ],
}
