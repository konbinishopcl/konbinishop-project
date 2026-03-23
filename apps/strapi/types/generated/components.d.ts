import type { Schema, Struct } from '@strapi/strapi';

export interface EventDates extends Struct.ComponentSchema {
  collectionName: 'components_event_dates';
  info: {
    displayName: 'dates';
    icon: 'calendar';
  };
  attributes: {
    date: Schema.Attribute.Date;
    end_time: Schema.Attribute.Time;
    start_time: Schema.Attribute.Time;
  };
}

export interface EventPrices extends Struct.ComponentSchema {
  collectionName: 'components_event_prices';
  info: {
    displayName: 'prices';
    icon: 'calendar';
  };
  attributes: {
    name: Schema.Attribute.String & Schema.Attribute.Required;
    price: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<0>;
  };
}

export interface EventRrss extends Struct.ComponentSchema {
  collectionName: 'components_event_rrsses';
  info: {
    displayName: 'rrss';
    icon: 'link';
  };
  attributes: {
    link: Schema.Attribute.String;
  };
}

export interface EventVideos extends Struct.ComponentSchema {
  collectionName: 'components_event_videos';
  info: {
    displayName: 'videos';
    icon: 'play';
  };
  attributes: {
    link: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'event.dates': EventDates;
      'event.prices': EventPrices;
      'event.rrss': EventRrss;
      'event.videos': EventVideos;
    }
  }
}
