export interface Person {
  name: string;
  occupation: string;
  description: string;
  photo: string;
}

export interface Couple {
  bride: Person;
  groom: Person;
  hashtag: string;
  heroImage: string;
  weddingDate: string; // ISO string e.g. "2026-12-12T10:00:00"
  families: {
    brideFamily: string;
    groomFamily: string;
  };
}

export interface EventItem {
  title: string;
  date: string;
  time: string;
  description: string;
  icon: string;
}

export interface Venue {
  name: string;
  address: string;
  mapEmbedUrl: string;
  mapDirectionsUrl: string;
}

export interface GalleryImage {
  category: string;
  url: string;
  caption: string;
}

export interface StoryMilestone {
  title: string;
  date: string;
  icon: string;        // bootstrap-icons class, e.g. "bi-heart-fill"
}

export interface ParentSide {
  side: string;        // e.g. "Bride's Parents"
  father: string;
  mother: string;
  blessing: string;
}


export interface WeddingData {
  couple: Couple;
  story: StoryMilestone[];
  parents: ParentSide[];
  events: EventItem[];
  venue: Venue;
  gallery: GalleryImage[];
  music: {
    // A playlist — a random track is chosen each time the site is opened.
    tracks: { title: string; url: string }[];
  };
  social: {
    instagram: string;
    facebook: string;
    whatsapp: string;
    telegram: string;
  };
  tribute: {
    friendName: string;
    photo: string;
    message: string;
  };
  site: {
    title: string;
    description: string;
    createdBy: string;
  };
}