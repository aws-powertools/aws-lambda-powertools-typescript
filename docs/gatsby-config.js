const docsWebsite = "https://awslabs.github.io/aws-lambda-powertools-typescript"

module.exports = {
    pathPrefix: '/aws-lambda-powertools-typescript',
    siteMetadata: {
        title: 'AWS Lambda Powertools typescript',
        description: 'A suite of utilities for AWS Lambda functions that makes tracing with AWS X-Ray, structured logging and creating custom metrics asynchronously easier',
        author: `Amazon Web Services`,
        siteName: 'AWS Lambda Powertools typescript',
        siteUrl: `${docsWebsite}`
    },
    plugins: [
        {
            resolve: 'gatsby-theme-apollo-docs',
            options: {
                root: __dirname,
                menuTitle: 'Helpful resources',
                githubRepo: 'awslabs/aws-lambda-powertools-typescript',
                baseUrl: `${docsWebsite}`,
                algoliaApiKey: 'a8491b576861e819fd50d567134eb9ce',
                algoliaIndexName: 'aws-lambda-powertools-typescript',
                logoLink: `${docsWebsite}`,
                sidebarCategories: {
                    null: [
                        'index'
                    ],
                    'Core utilities': [
                        'core/tracer',
                        'core/logger',
                        'core/metrics'
                    ],
                    'Utilities': [
                        'utilities/middleware_factory',
                        'utilities/parameters',
                        'utilities/batch',
                        'utilities/typing',
                        'utilities/validation',
                        'utilities/data_classes',
                        'utilities/parser'
                    ],
                },
                navConfig: {
                    'Serverless Best Practices video': {
                        url: 'https://www.youtube.com/watch?v=9IYpGTS7Jy0',
                        description: 'AWS re:Invent ARC307: Serverless architectural patterns & best practices - Origins of Powertools',
                    },
                    'AWS Well-Architected Serverless Lens': {
                        url: 'https://d1.awsstatic.com/whitepapers/architecture/AWS-Serverless-Applications-Lens.pdf',
                        description: 'AWS Well-Architected Serverless Applications Lens whitepaper',
                    },
                    'Amazon Builders Library': {
                        url: 'https://aws.amazon.com/builders-library/',
                        description: 'Collection of living articles covering topics across architecture, software delivery, and operations'
                    },
                    'AWS CDK Patterns': {
                        url: 'https://cdkpatterns.com/patterns/',
                        description: "CDK Patterns maintained by Matt Coulter (@nideveloper)"
                    }
                },
                footerNavConfig: {
                    'API Reference': {
                        href: 'https://awslabs.github.io/aws-lambda-powertools-typescript/api/',
                        target: '_blank'
                    },
                    Serverless: {
                        href: 'https://aws.amazon.com/serverless/'
                    },
                    'AWS SAM Docs': {
                        href: 'https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html',
                    }
                }
            }
        },
        {
            resolve: `gatsby-plugin-catch-links`,
            options: {
                excludePattern: /\/aws-lambda-powertools-typescript/,
            },
        },
        'gatsby-plugin-antd',
        'gatsby-remark-autolink-headers',
        'gatsby-plugin-sitemap'
    ]
};
