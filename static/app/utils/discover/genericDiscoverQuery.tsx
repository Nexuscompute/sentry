import {Component, useContext} from 'react';
import {Location} from 'history';

import {EventQuery} from 'sentry/actionCreators/events';
import {Client, ResponseMeta} from 'sentry/api';
import {t} from 'sentry/locale';
import EventView, {
  ImmutableEventView,
  isAPIPayloadSimilar,
  LocationQuery,
} from 'sentry/utils/discover/eventView';
import {PerformanceEventViewContext} from 'sentry/utils/performance/contexts/performanceEventViewContext';
import {OrganizationContext} from 'sentry/views/organizationContext';

import {decodeScalar} from '../queryString';

export class QueryError {
  message: string;
  private originalError: any; // For debugging in case parseError picks a value that doesn't make sense.
  constructor(errorMessage: string, originalError?: any) {
    this.message = errorMessage;
    this.originalError = originalError;
  }

  getOriginalError() {
    return this.originalError;
  }
}

export type GenericChildrenProps<T> = {
  /**
   * Error, if not null.
   */
  error: null | QueryError;
  /**
   * Loading state of this query.
   */
  isLoading: boolean;
  /**
   * Pagelinks, if applicable. Can be provided to the Pagination component.
   */
  pageLinks: null | string;
  /**
   * Data / result.
   */
  tableData: T | null;
};

type OptionalContextProps = {
  eventView?: EventView | ImmutableEventView;
  orgSlug?: string;
};

type BaseDiscoverQueryProps = {
  api: Client;
  /**
   * Used as the default source for cursor values.
   */
  location: Location;
  /**
   * Explicit cursor value if you aren't using `location.query.cursor` because there are
   * multiple paginated results on the page.
   */
  cursor?: string;
  /**
   * Record limit to get.
   */
  limit?: number;
  /**
   * Include this whenever pagination won't be used. Limit can still be used when this is
   * passed, but cursor will be ignored.
   */
  noPagination?: boolean;
  /**
   * Extra query parameters to be added.
   */
  queryExtras?: Record<string, string>;
  /**
   * Sets referrer parameter in the API Payload. Set of allowed referrers are defined
   * on the OrganizationEventsV2Endpoint view.
   */
  referrer?: string;
  /**
   * A callback to set an error so that the error can be rendered in parent components
   */
  setError?: (errObject: QueryError | undefined) => void;
};

export type DiscoverQueryPropsWithContext = BaseDiscoverQueryProps & OptionalContextProps;
export type DiscoverQueryProps = BaseDiscoverQueryProps & {
  eventView: EventView | ImmutableEventView;
  orgSlug: string;
};

type InnerRequestProps<P> = DiscoverQueryProps & P;
type OuterRequestProps<P> = DiscoverQueryPropsWithContext & P;

export type ReactProps<T> = {
  children?: (props: GenericChildrenProps<T>) => React.ReactNode;
};

type ComponentProps<T, P> = {
  /**
   * Route to the endpoint
   */
  route: string;
  /**
   * A hook to modify data into the correct output after data has been received
   */
  afterFetch?: (data: any, props?: Props<T, P>) => T;
  /**
   * A hook before fetch that can be used to do things like clearing the api
   */
  beforeFetch?: (api: Client) => void;
  /**
   * A hook for parent orchestrators to pass down data based on query results, unlike afterFetch it is not meant for specializations as it will not modify data.
   */
  didFetch?: (data: T) => void;
  /**
   * Allows components to modify the payload before it is set.
   */
  getRequestPayload?: (props: Props<T, P>) => any;
  /**
   * An external hook to parse errors in case there are differences for a specific api.
   */
  parseError?: (error: any) => QueryError | null;
  /**
   * An external hook in addition to the event view check to check if data should be refetched
   */
  shouldRefetchData?: (prevProps: Props<T, P>, props: Props<T, P>) => boolean;
};

type Props<T, P> = InnerRequestProps<P> & ReactProps<T> & ComponentProps<T, P>;
type OuterProps<T, P> = OuterRequestProps<P> & ReactProps<T> & ComponentProps<T, P>;

type State<T> = {
  tableFetchID: symbol | undefined;
} & GenericChildrenProps<T>;

/**
 * Generic component for discover queries
 */
class _GenericDiscoverQuery<T, P> extends Component<Props<T, P>, State<T>> {
  state: State<T> = {
    isLoading: true,
    tableFetchID: undefined,
    error: null,

    tableData: null,
    pageLinks: null,
  };

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps: Props<T, P>) {
    // Reload data if the payload changes
    const refetchCondition = this._shouldRefetchData(prevProps);

    // or if we've moved from an invalid view state to a valid one,
    const eventViewValidation =
      prevProps.eventView.isValid() === false && this.props.eventView.isValid();

    const shouldRefetchExternal = this.props.shouldRefetchData
      ? this.props.shouldRefetchData(prevProps, this.props)
      : false;

    if (refetchCondition || eventViewValidation || shouldRefetchExternal) {
      this.fetchData();
    }
  }

  getPayload(props: Props<T, P>) {
    const {cursor, limit, noPagination, referrer, location} = props;
    const payload = this.props.getRequestPayload
      ? this.props.getRequestPayload(props)
      : props.eventView.getEventsAPIPayload(props.location);

    if (cursor) {
      payload.cursor = cursor;
    }
    if (limit) {
      payload.per_page = limit;
    }
    if (noPagination) {
      payload.noPagination = noPagination;
    }
    if (referrer) {
      payload.referrer = referrer;
    }

    if (['events', 'eventsv2'].includes(props.route)) {
      const queryUserModified = decodeScalar(location.query?.userModified);
      if (queryUserModified !== undefined) {
        payload.user_modified = queryUserModified;
      }
    }

    Object.assign(payload, props.queryExtras ?? {});

    return payload;
  }

  _shouldRefetchData = (prevProps: Props<T, P>): boolean => {
    const thisAPIPayload = this.getPayload(this.props);
    const otherAPIPayload = this.getPayload(prevProps);

    return (
      !isAPIPayloadSimilar(thisAPIPayload, otherAPIPayload) ||
      prevProps.limit !== this.props.limit ||
      prevProps.route !== this.props.route ||
      prevProps.cursor !== this.props.cursor
    );
  };

  /**
   * The error type isn't consistent across APIs. We see detail as just string some times, other times as an object.
   */
  _parseError = (error: any): QueryError | null => {
    if (this.props.parseError) {
      return this.props.parseError(error);
    }

    if (!error) {
      return null;
    }

    const detail = error.responseJSON?.detail;
    if (typeof detail === 'string') {
      return new QueryError(detail, error);
    }

    const message = detail?.message;
    if (typeof message === 'string') {
      return new QueryError(message, error);
    }

    const unknownError = new QueryError(t('An unknown error occurred.'), error);
    return unknownError;
  };

  fetchData = async () => {
    const {api, beforeFetch, afterFetch, didFetch, eventView, orgSlug, route, setError} =
      this.props;

    if (!eventView.isValid()) {
      return;
    }

    const url = `/organizations/${orgSlug}/${route}/`;
    const tableFetchID = Symbol(`tableFetchID`);
    const apiPayload: Partial<EventQuery & LocationQuery> = this.getPayload(this.props);

    this.setState({isLoading: true, tableFetchID});

    setError?.(undefined);

    beforeFetch?.(api);

    // clear any inflight requests since they are now stale
    api.clear();

    try {
      const [data, , resp] = await doDiscoverQuery<T>(api, url, apiPayload);
      if (this.state.tableFetchID !== tableFetchID) {
        // invariant: a different request was initiated after this request
        return;
      }

      const tableData = afterFetch ? afterFetch(data, this.props) : data;
      didFetch?.(tableData);

      this.setState(prevState => ({
        isLoading: false,
        tableFetchID: undefined,
        error: null,
        pageLinks: resp?.getResponseHeader('Link') ?? prevState.pageLinks,
        tableData,
      }));
    } catch (err) {
      const error = this._parseError(err);
      this.setState({
        isLoading: false,
        tableFetchID: undefined,
        error,
        tableData: null,
      });
      if (setError) {
        setError(error ?? undefined);
      }
    }
  };

  render() {
    const {isLoading, error, tableData, pageLinks} = this.state;

    const childrenProps: GenericChildrenProps<T> = {
      isLoading,
      error,
      tableData,
      pageLinks,
    };
    const children: ReactProps<T>['children'] = this.props.children; // Explicitly setting type due to issues with generics and React's children
    return children?.(childrenProps);
  }
}

// Shim to allow us to use generic discover query or any specialization with or without passing org slug or eventview, which are now contexts.
// This will help keep tests working and we can remove extra uses of context-provided props and update tests as we go.
export function GenericDiscoverQuery<T, P>(props: OuterProps<T, P>) {
  const organizationSlug = useContext(OrganizationContext)?.slug;
  const performanceEventView = useContext(PerformanceEventViewContext)?.eventView;

  const orgSlug = props.orgSlug ?? organizationSlug;
  const eventView = props.eventView ?? performanceEventView;

  if (orgSlug === undefined || eventView === undefined) {
    throw new Error('GenericDiscoverQuery requires both an orgSlug and eventView');
  }

  const _props: Props<T, P> = {
    ...props,
    orgSlug,
    eventView,
  };
  return <_GenericDiscoverQuery<T, P> {..._props} />;
}

export type DiscoverQueryRequestParams = Partial<EventQuery & LocationQuery>;

export async function doDiscoverQuery<T>(
  api: Client,
  url: string,
  params: DiscoverQueryRequestParams
): Promise<[T, string | undefined, ResponseMeta | undefined]> {
  return api.requestPromise(url, {
    method: 'GET',
    includeAllArgs: true,
    query: {
      // marking params as any so as to not cause typescript errors
      ...(params as any),
    },
  });
}

export default GenericDiscoverQuery;
