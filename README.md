# k6s

Performance tests for .Stat Suite using [k6](https://k6.io/), plus a helper script to load the sample structures and data the tests need.

## Requirements

- [uv](https://docs.astral.sh/uv/) (Python >= 3.12) for `load_data.py`
- [Docker](https://www.docker.com/) for `run.sh` (k6 runs in the `grafana/k6` image)

Install the Python dependencies:

```bash
uv sync
```

## Configuration

Both scripts read their settings from the `.env` file in the repo root:

| Variable | Description |
| --- | --- |
| `KEYCLOAK_BASE_URL` | Keycloak realm URL; the OpenID and token URLs are derived from it |
| `KEYCLOAK_CLIENT_ID` | Keycloak client id |
| `KEYCLOAK_USER` / `KEYCLOAK_PASSWORD` | Credentials used to authenticate |
| `DATASPACE` | Target dataspace (e.g. `design`, `staging`) |
| `TRANSFER_URL` | Transfer service URL |
| `NSI_URL` | NSI web service URL, built from `DATASPACE` |
| `DOCKER_IMAGE` | k6 Docker image |

`DATASPACE` defaults to the value in `.env`, but you can override it with an environment variable (or with the second argument of `run.sh`):

```bash
DATASPACE=design uv run python load_data.py --sample-data-dir PerformanceTests/FAO
```

## Loading sample data

Before you run the tests, load the structures and data for a test suite:

```bash
uv run python load_data.py --sample-data-dir PerformanceTests/FAO
```

The script searches the given directory recursively, then:

1. Uploads every `*.xml` structure file to the NSI (`/rest/structure`).
2. Imports every `*.csv` and `*.zip` data file through the Transfer service into `DATASPACE`.

The Keycloak user needs permission to create the structures and import data in that dataspace.

## Running the tests

```bash
./run.sh FAO design
```

Arguments:

1. **Test suite** (required): a folder under `PerformanceTests/`, e.g. `FAO` or `OECD`.
2. **Dataspace** (optional): overrides `DATASPACE` from `.env`.

The tests to run are listed in the `suite` array in `run.sh`; comment or uncomment entries to pick them. Each test runs as `PerformanceTests/<suite>/<test>.js` inside the k6 container.

Logs are written to `logs/<suite>-<dataspace>-<test>-<timestamp>.log`.

## Layout

```
PerformanceTests/
  utils.js                  shared k6 helpers
  FAO/ , OECD/              test suites
    *-test-*.js             k6 test scripts
    utils.js                suite helpers
    Resources/
      Structures/           SDMX structure files (*.xml)
      Data/                 data files (*.csv, *.zip)
      test-cases-*.json     test case definitions
```
