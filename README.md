# ApiExternaFrontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.7.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Docker

A imagem deste repositório é multi-stage: o Node compila o bundle e o nginx o
serve. Não há SSR, então a imagem final não carrega runtime de Node.

O nginx também repassa as chamadas de API (`/auth`, `/investidores`,
`/corretoras`, `/carteiras`, `/acoes`, `/operacoes`, `/mercado`) para o backend.
Isso é o que permite o código Angular continuar chamando **caminho relativo**,
como ele já faz com o `proxy.conf.json` em desenvolvimento — e é o que faz o
CORS deixar de existir: o navegador só enxerga uma origem.

> Mexeu nos prefixos do `proxy.conf.json`? Mexa também em
> `nginx/padrao.conf.template`. Divergir entre os dois cria um caminho que
> funciona no `ng serve` e devolve 404 no container.

Construir e rodar só o frontend, contra um backend já no ar:

```bash
docker build -t investimentos-web .
docker run --rm -p 8081:80 -e BACKEND_URL=http://host.docker.internal:8080 investimentos-web
```

O sistema inteiro — banco, API e frontend — sobe pelo `docker-compose.yml` do
repositório do backend, que constrói a imagem daqui pelo caminho em
`FRONTEND_PATH`:

```bash
cd ../../Spring/api-externa-backend-v1
cp .env.example .env    # preencha as chaves
docker compose up --build
# → http://localhost:8081
```

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
