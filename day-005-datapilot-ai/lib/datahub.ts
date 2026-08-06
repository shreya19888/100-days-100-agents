const DATAHUB_URL = "http://localhost:8080/api/graphql";

export async function searchDatasets(query: string) {
  const graphqlQuery = `
query Search($input: SearchInput!) {
  search(input: $input) {
    start
    count
    total
    searchResults {
      entity {
        urn
        type
      }
    }
  }
}
`;

  const response = await fetch(DATAHUB_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: graphqlQuery,
      variables: {
        input: {
          type: "DATASET",
          query,
          start: 0,
          count: 10,
        },
      },
    }),
  });

  const text = await response.text();
  console.log("=================================");
  console.log(text);
  console.log("=================================");
  return {
    status: response.status,
    body: text,
  };
}