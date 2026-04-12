# Contributing to Nexus Intelligence

Thank you for your interest in contributing to Nexus Intelligence! This document provides guidelines for contributors.

## Developer Certificate of Origin (DCO)

All contributions to this project must comply with the Developer Certificate of Origin (DCO). This ensures that all contributions are properly licensed and traceable.

### How to Sign Your Commits

To certify your commits, add the following line to your commit message:

```
Signed-off-by: Your Name <your.email@example.com>
```

### Using Git to Automatically Sign Off

You can configure Git to automatically sign off your commits:

```bash
git config --global commit.signOff true
```

Or manually sign off during commit:

```bash
git commit -s -m "Your commit message"
```

## Contribution Process

1. **Fork the Repository**
   ```bash
   # Fork the repository on GitHub, then clone your fork
   git clone https://github.com/your-username/nexus-intelligence.git
   cd nexus-intelligence
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Your Changes**
   - Follow the existing code style and patterns
   - Add tests for new functionality
   - Update documentation as needed
   - Ensure all tests pass

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -s -m "feat: add new feature description"
   ```

5. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Go to the original repository on GitHub
   - Click "New Pull Request"
   - Fill in the PR template
   - Wait for review

## Code Standards

### Python (Backend)
- Follow PEP 8 style guidelines
- Use type hints for all functions
- Write docstrings for all public functions
- Keep functions small and focused

### TypeScript (Frontend)
- Use strict TypeScript mode
- Follow existing component patterns
- Use descriptive variable names
- Add JSDoc comments for complex functions

### Testing
- Write tests for all new features
- Ensure test coverage remains above 80%
- Use meaningful test data
- Test both happy path and edge cases

## Code Review Process

All contributions go through code review to ensure:
- Code quality and maintainability
- Security best practices
- Performance considerations
- Documentation completeness

## License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project (MIT License).

## Getting Help

If you need help with contributing:
- Create an issue with the question label
- Join our community discussions
- Check existing documentation

Thank you for contributing to Nexus Intelligence!
