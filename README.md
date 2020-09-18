## Apollo Express Boiler

Using apollo-server-express. Redis with express-session for 🍪. TypeGraphQL along with TypeORM and Postgres. Sendgrid for emails. Yup for validation.

Basic user auth setup. See `/src/resolvers/user.ts`. Argon2 password hashing.

## Set up

1. Requires Postgres and Redis running locally. Requires TypeScript.
2. `yarn`
3. `cp .env.example .env` -> setup variables
4. `yarn watch` and `yarn dev`

## Notes

By default Sendgrid will be in **sandbox mode** when `NODE_ENV` is set to `production`.

Will automatically run migrations by default. See `conn.runMigrations()` in `/src/index.ts`

`yarn test` to run tests
