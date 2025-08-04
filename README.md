# Table Editor

Hate how Google Docs can't handle tables with more than five columns? Find it
clunky when you have create a text-based spreadsheet in Google Sheets? Hate it
when two people try to edit the same thing at the same time? This table editor
is the solution for you.

## Setup

### Dependencies

The sole dependency needed to run this program is Docker. See
[docs.docker.com](https://docs.docker.com/desktop/) for instructions on
installing Docker Desktop on your computer.

One you have docker installed, you can start the app by running the following
command from the repository root:

```
docker compose up --build -d
```

In order to read the logs from any of the services that make up the table
editor, simply run the following command:

```
docker compose logs <service_name>
```

The names of the services (i.e. reverse\_proxy, rest\_api, etc.) are given in
docker-compose.yml.

Building the necessary images can be resource intensive. You should have at
least 10G of free space on your device before you run the Table Editor.

## License

See [LICENSE](./LICENSE).
