import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { DomainEvent } from "./domain-event";

/**
 * Bus de eventos in-process (FASE 4). Desacopla emisores de consumidores
 * sin Kafka/RabbitMQ. Los listeners se suscriben con @OnEvent(name).
 */
@Injectable()
export class DomainEventBus {
  private readonly logger = new Logger(DomainEventBus.name);

  constructor(private readonly emitter: EventEmitter2) {}

  publish(event: DomainEvent): void {
    this.logger.debug(`Evento publicado: ${event.name} (tenant ${event.tenantId})`);
    this.emitter.emit(event.name, event);
  }
}
