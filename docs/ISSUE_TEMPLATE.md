# GitHub Issue Creation Template

## Script Template

```javascript
const issues = [
  {
    title: 'Your Issue Title',
    body: `### Scope/Feature Name
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3
- [ ] Task 4

PR Scope: Brief description of what this PR will include`,
    labels: ['label1', 'label2'],
  },
  // Copy this structure for each issue
];

async function createIssues() {
  const token = 'YOUR_GITHUB_TOKEN';
  const repo = 'churnistic';
  const owner = 'menezmethod';

  for (const issue of issues) {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        title: issue.title,
        body: issue.body,
        labels: issue.labels,
      }),
    });

    if (response.ok) {
      console.log(`Created issue: ${issue.title}`);
    } else {
      console.error(`Failed to create issue: ${issue.title}`);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
```

## Common Labels

- "frontend"
- "backend"
- "feature"
- "bug"
- "enhancement"
- "documentation"
- "testing"
- "security"
- "api"
- "ui"
- "database"
- "infrastructure"

## Issue Structure Template

```javascript
{
  title: "Clear, Action-Oriented Title",
  body: `### Feature Name
- [ ] Specific task
- [ ] Specific task
- [ ] Specific task

PR Scope: What will be delivered`,
  labels: ["relevant", "labels"]
}
```

## How to Use

1. Create a GitHub Personal Access Token:

   - Go to GitHub.com → Your profile picture → Settings
   - Scroll to "Developer settings" → "Personal access tokens" → "Tokens (classic)"
   - Click "Generate new token (classic)"
   - Select the "repo" scope
   - Copy the generated token

2. Go to your repository page on GitHub

3. Open Developer Console:

   - Mac: Command + Option + J
   - Windows/Linux: F12 or Ctrl + Shift + J
   - Or right-click → Inspect → Console tab

4. Copy the script template

   - Replace `YOUR_GITHUB_TOKEN` with your actual token
   - Add your issues following the Issue Structure Template
   - Modify owner/repo if needed

5. Paste the modified script into the console

6. Run the script by typing:

```javascript
createIssues();
```

## Best Practices

1. Issue Creation:

   - Keep tasks atomic and specific
   - Include clear acceptance criteria
   - Add relevant links or dependencies
   - Mention related issues if applicable

2. Security:

   - Never commit tokens to the repository
   - Revoke tokens after suspected exposure
   - Use tokens with minimum required permissions

3. Organization:
   - Group related tasks into single issues
   - Use consistent labeling
   - Include PR scope for each issue
   - Keep tasks focused and manageable

## Example Issue

```javascript
{
  title: "Implement User Authentication Flow",
  body: `### Authentication System
- [ ] Create login form component
- [ ] Add form validation
- [ ] Implement authentication service
- [ ] Add error handling

PR Scope: Complete user authentication flow with form and validation`,
  labels: ["frontend", "security", "feature"]
}
```
