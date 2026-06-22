import { Component, OnInit, signal } from '@angular/core';
import AOS from 'aos';
import { WeddingDataService } from './services/wedding-data.service';
import { WeddingData } from './models/wedding.model';
import { Navbar } from './components/navbar/navbar';
import { Hero } from './components/hero/hero';
import { CoupleSection } from './components/couple/couple';
import { Story } from './components/story/story';
import { Parents } from './components/parents/parents';
import { InvitationCard } from  './components/invitation-card/invitation-card';
import { Countdown } from './components/countdown/countdown';
import { Events } from './components/events/events';
import { VenueSection } from './components/venue/venue';
import { Gallery } from './components/gallery/gallery';
import { GuestWishes } from './components/guest-wishes/guest-wishes';
import { Rsvp } from './components/Rsvp/Rsvp';
import { MusicPlayer } from  './components/music-player/music-player';
import { Share } from './components/share/share';
import { QrCode } from './components/qr-code/qr-code';
import { FriendshipTribute } from './components/friendship-tribute/friendship-tribute';
import { Footer } from './components/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    Navbar,
    Hero,
    CoupleSection,
    Story,
    Parents,
    InvitationCard,
    Countdown,
    Events,
    VenueSection,
    Gallery,
    GuestWishes,
    Rsvp,
    MusicPlayer,
    Share,
    QrCode,
    FriendshipTribute,
    Footer
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  readonly data = signal<WeddingData | null>(null);

  constructor(private weddingData: WeddingDataService) {}

  async ngOnInit(): Promise<void> {
    const result = await this.weddingData.load();
    this.data.set(result);

    setTimeout(() => {
      AOS.init({
        duration: 800,
        once: true,
        easing: 'ease-out-cubic'
      });
    });
  }
}