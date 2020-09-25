# web-updates-checker

## NOTICE

**This repository is currently under develop.**  
There may be some breaking changes which requires you to delete your repository.

With this repository, you don't have to do anything other than creating issue.  
Before using this, please read [Usage](#usage) below.


## Usage

### 1. Click "Use this template" above

You should make the repository private, otherwise users other than you can use your repository to check updates.  
Additionally, you should unwatch the created repository.
If you keep it watched, you will receive emails per 15 minutes.

### 2. Create new issue


## Development

When you fork this repository, please update this line in files under `.github/workflows`.

```yaml
    if: github.repository != 'kyori19/web-updates-checker'
```
