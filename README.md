+ role_permission from backend
-> rbac.js->Home.jsx-> [RequirePerm.jsx it is Protect routes too (staff can’t open URL manually)]
-> Roles.jsx or Users.jsx ( can.view or can.create)

+ use Redux
- npm i @reduxjs/toolkit react-redux @tanstack/react-query
- CreateUser.jsx , CreateRole.jsx, CreateCategory, EditCategory not use ( Redux for Create)

Users.jsx            = logic មេ / fetch / mutation
UserStats.jsx        = card count users
UserToolbar.jsx      = search + add button
UserTable.jsx        = table list users
UserFormModal.jsx    = form add/update user
userSchema.js        = Zod validation
userUtils.js         = helper functions

