# Contributing Guidelines

Thank you for your interest in contributing to our project. Whether it's a bug report, new feature, correction, or additional
documentation, we greatly value feedback and contributions from our community.

Please read through this document before submitting any issues or pull requests to ensure we have all the necessary
information to effectively respond to your bug report or contribution.

## Security issue notifications
If you discover a potential security issue in this project we ask that you notify AWS/Amazon Security via our [vulnerability reporting page](http://aws.amazon.com/security/vulnerability-reporting/). Please do **not** create a public GitHub issue.

## Reporting Bugs/Feature Requests

We welcome you to use the GitHub issue tracker to report bugs or suggest features.

When filing an issue, please check existing open, or recently closed, issues to make sure somebody else hasn't already
reported the issue. Please try to include as much information as you can. Details like these are incredibly useful:

* A reproducible test case or series of steps
* The version of our code being used
* Any modifications you've made relevant to the bug
* Anything unusual about your environment or deployment

## Contributing via Pull Requests

Contributions via pull requests are much appreciated. Before sending us a pull request, please ensure that:

1. You are working against the latest source on the **main** branch.
2. You check existing open, and recently merged pull requests to make sure someone else hasn't addressed the problem already.
3. You open an [RFC issue](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/new?assignees=&labels=RFC%2C+triage&template=rfc.md&title=RFC%3A+) to discuss any significant work - we would hate for your time to be wasted.

### Dev setup

To send us a pull request, please follow these steps:

1. Fork the repository.
2. Install dependencies: `npm install`
3. Prepare utilities like commit hooks: `npm run prepare`
4. Create a new branch to focus on the specific change you are contributing e.g. `git checkout -b improv/logger-debug-sampling`
5. Run all tests, and code baseline checks: `npm run test`
6. Commit to your fork using clear commit messages.
7. Send us a pull request with a [conventional semantic title](https://github.com/awslabs/aws-lambda-powertools-typescript/pull/67), and answering any default questions in the pull request interface.
8. Pay attention to any automated CI failures reported in the pull request, and stay involved in the conversation.

GitHub provides an additional document on [forking a repository](https://help.github.com/articles/fork-a-repo/) and
[creating a pull request](https://help.github.com/articles/creating-a-pull-request/).

### Conventions

Category | Convention
------------------------------------------------- | ---------------------------------------------------------------------------------
**Docstring** |  We use a slight variation of numpy convention with markdown to help generate more readable API references.
**Style guide** | We use black as well as flake8 extensions to enforce beyond good practices [PEP8](https://pep8.org/). We strive to make use of type annotation as much as possible, but don't overdo in creating custom types.
**Core utilities** | Core utilities use a Class, always accept `service` as a constructor parameter, can work in isolation, and are also available in other languages implementation.
**Utilities** | Utilities are not as strict as core and focus on solving a developer experience problem while following the project [Tenets](https://awslabs.github.io/aws-lambda-powertools-typescript/#tenets).
**Exceptions** | Specific exceptions live within utilities themselves and use `Error` suffix e.g. `MetricUnitError`.
**Git commits** | We follow [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/). These are not enforced as we squash and merge PRs, but PR titles are enforced during CI.
**Documentation** | API reference docs are generated from docstrings which should have Examples section to allow developers to have what they need within their own IDE. Documentation website covers the wider usage, tips, and strive to be concise.

## Finding contributions to work on

Looking at the existing issues is a great way to find something to contribute on. As our projects, by default, use the default GitHub issue labels (enhancement/bug/help wanted/invalid/question/documentation), looking at any 'help wanted' issues is a great place to start.

## Code of Conduct

This project has adopted the [Amazon Open Source Code of Conduct](https://aws.github.io/code-of-conduct).
For more information see the [Code of Conduct FAQ](https://aws.github.io/code-of-conduct-faq) or contact
opensource-codeofconduct@amazon.com with any additional questions or comments.

## Troubleshooting

### API reference documentation

TODO

## Licensing

See the [LICENSE](LICENSE) file for our project's licensing. We will ask you to confirm the licensing of your contribution.

We may ask you to sign a [Contributor License Agreement (CLA)](http://en.wikipedia.org/wiki/Contributor_License_Agreement) for larger changes.