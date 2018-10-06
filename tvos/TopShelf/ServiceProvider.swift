//
//  ServiceProvider.swift
//  TopShelf
//
//  Created by Egor A. Blinov on 05.10.18.
//  Copyright © 2018 Anton Ignatov. All rights reserved.
//

import Foundation
import TVServices

class ServiceProvider: NSObject, TVTopShelfProvider {

    override init() {
        super.init()
    }

    // MARK: - TVTopShelfProvider protocol

    var topShelfStyle: TVTopShelfContentStyle {
        // Return desired Top Shelf style.
        return .sectioned
    }

    var topShelfItems: [TVContentItem] {
        var SectionsItems = [TVContentItem]();
        do {
            let topShelfJSON = UserDefaults(suiteName: "group.com.antonignatov.soap4me")!
                .string(forKey: "topShelf")!
                .data(using: String.Encoding.utf8, allowLossyConversion: false)

            let topShelf = try JSONSerialization.jsonObject(with: topShelfJSON!) as! [String: Any]
            
            for sectionData in topShelf["sections"] as! [[String: Any]] {
                let sectionItem = TVContentItem(contentIdentifier: TVContentIdentifier(identifier: sectionData["id"] as! String, container: nil)!)

                var sectionTopShelfItems = [TVContentItem]();
                for itemData in sectionData["items"] as! [[String: Any]] {
                    let contentItem = TVContentItem(contentIdentifier: TVContentIdentifier(identifier: itemData["id"] as! String, container: nil)!)

                    contentItem!.imageURL = URL(string: (itemData["imageURL"] as? String)!)
                    contentItem!.imageShape = .square
                    contentItem!.displayURL = URL(string: (itemData["displayURL"] as? String)!);
                    contentItem!.title = itemData["title"] as? String
                    sectionTopShelfItems.append(contentItem!)
                }
                
                sectionItem!.title = sectionData["title"] as? String
                sectionItem!.topShelfItems = sectionTopShelfItems
                SectionsItems.append(sectionItem!)
            }
        } catch {
            print("Error processing data: \(error)")
        }
        return SectionsItems
    }

}

