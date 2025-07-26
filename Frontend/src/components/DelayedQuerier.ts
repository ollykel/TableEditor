import { useState } from "react";

// Waits a certain amount of time before running a query.
// If a new query is requested before the previous query executes, the previous
// query is cancelled.
// Prevents an excessive number of queries from being sent to an API (i.e.
// whilte user is typing), while still allowing for responsiveness for functions
// such as autocomplete.
const DelayedQuerier = ({ queryFn, waitMS }: { queryFn: (query: string) => Promise<any>, waitMS: number }) => {
  const [timeoutID, setTimeoutID] = useState<ReturnType<typeof setTimeout> | null>(null);

  const cancelSearch = () => {
    if (timeoutID !== null)
    {
      clearTimeout(timeoutID);
    }
    setTimeoutID(null);
  };

  const newQuery = (query: string): Promise<void> => {
    if (timeoutID !== null)
    {
      // cancel previous search (don't want to send too many queries)
      clearTimeout(timeoutID);
    }

    return new Promise((resolve, reject) => {
      setTimeoutID(setTimeout(() => {
        queryFn(query)
          .then(resolve, reject)
          .finally(() => setTimeoutID(null));
      }, waitMS));
    });
  };

  return ({ cancelSearch, newQuery });
};

export default DelayedQuerier;
