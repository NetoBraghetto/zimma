FROM golang:1.26

WORKDIR /api

RUN go install github.com/air-verse/air@latest \
  && go install github.com/pressly/goose/v3/cmd/goose@latest

CMD ["air"]
